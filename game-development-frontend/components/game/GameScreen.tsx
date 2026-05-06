// game-development-frontend/components/game/GameScreen.tsx

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

import { usePlayer } from '@/context/PlayerContext'
import { useWorld } from '@/context/WorldContext'
import { playerApi } from '@/lib/api/player'

import GameHud from './GameHud'
import BattleEncounterScreen from './BattleEncounterScreen'
import LoadingScreen from '@/components/ui/LoadingScreen'
import ErrorMessage from '@/components/ui/ErrorMessage'

import type { ActiveEncounter, PlayerPosition, WorldItemSpawn } from '@/types'

const GameMap = dynamic(() => import('./GameMap'), {
  ssr: false,
  loading: () => <LoadingScreen message="Loading map…" />,
})

const WORLD_REFRESH_INTERVAL_MS = 45_000

interface GameScreenProps {
  position: PlayerPosition
  gpsUnavailable: boolean
}

export default function GameScreen({
  position,
  gpsUnavailable,
}: GameScreenProps) {
  const {
    profile,
    refreshProfile,
    hasUsablePokemon,
    healParty,
    partyNeedsHealing,
  } = usePlayer()
  const {
    snapshot,
    spawnedPokemon,
    isLoading,
    error,
    fetchSnapshot,
    revealPokemon,
    despawnByDistance,
    removeWorldItem,
  } = useWorld()

  const [activeEncounter, setActiveEncounter] = useState<ActiveEncounter | null>(null)
  const [pickupError, setPickupError] = useState<string | null>(null)
  const [partyExhaustedMessage, setPartyExhaustedMessage] = useState<string | null>(null)
  const [healMessage, setHealMessage] = useState<string | null>(null)
  const lastFetchedRef = useRef<number>(0)

  const handleHealAtPokecenter = useCallback(() => {
    if (!partyNeedsHealing) return
    healParty()
    setPartyExhaustedMessage(null)
    setHealMessage('Your Pokémon are now full of health!')
    setTimeout(() => setHealMessage(null), 3_000)
  }, [healParty, partyNeedsHealing])

  const handleEncounter = useCallback(
    (encounter: ActiveEncounter) => {
      if (!hasUsablePokemon) {
        setPartyExhaustedMessage(
          'All your Pokémon are exhausted. Go to a Pokécenter to heal them first.',
        )
        return
      }
      setActiveEncounter(encounter)
    },
    [hasUsablePokemon],
  )

  useEffect(() => {
    if (!position) return

    const now = Date.now()
    if (now - lastFetchedRef.current < 5_000) return

    const loc = { latitude: position.latitude, longitude: position.longitude }
    fetchSnapshot(loc)
    despawnByDistance(loc)
    lastFetchedRef.current = now

    const interval = setInterval(() => {
      fetchSnapshot(loc)
    }, WORLD_REFRESH_INTERVAL_MS)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position?.latitude, position?.longitude])

  const handlePickupItem = useCallback(
    async (item: WorldItemSpawn) => {
      if (!position) return
      setPickupError(null)
      try {
        await playerApi.collectWorldItem(item.id, {
          latitude: position.latitude,
          longitude: position.longitude,
        })
        removeWorldItem(item.id)
        await refreshProfile()
      } catch (e) {
        setPickupError(e instanceof Error ? e.message : 'Could not pick up item.')
      }
    },
    [position, removeWorldItem, refreshProfile],
  )

  return (
    <div className="relative w-full h-full">
      <GameMap
        playerPosition={position}
        snapshot={snapshot}
        spawnedPokemon={spawnedPokemon}
        partyNeedsHealing={partyNeedsHealing}
        onRevealPokemon={revealPokemon}
        onEncounter={handleEncounter}
        onPickupItem={handlePickupItem}
        onHealAtPokecenter={handleHealAtPokecenter}
      />

      <GameHud
        profile={profile}
        position={position}
        isWorldLoading={isLoading}
        gpsUnavailable={gpsUnavailable}
      />

      {(error || pickupError || partyExhaustedMessage) && (
        <div className="absolute bottom-20 left-3 right-3 z-10">
          <ErrorMessage
            message={partyExhaustedMessage ?? pickupError ?? error ?? ''}
            onDismiss={
              partyExhaustedMessage
                ? () => setPartyExhaustedMessage(null)
                : pickupError
                  ? () => setPickupError(null)
                  : undefined
            }
          />
        </div>
      )}

      {healMessage && (
        <div className="absolute bottom-20 left-3 right-3 z-10">
          <div className="flex items-start gap-3 bg-emerald-900/80 border border-emerald-500 rounded-lg px-4 py-3 text-emerald-100">
            <span className="text-emerald-300 text-lg leading-none mt-0.5">✓</span>
            <p className="flex-1 text-sm">{healMessage}</p>
          </div>
        </div>
      )}

      {activeEncounter && (
        <BattleEncounterScreen
          encounter={activeEncounter}
          position={position}
          profile={profile}
          onClose={async (captured: boolean) => {
            setActiveEncounter(null)
            if (captured) await refreshProfile()
          }}
        />
      )}
    </div>
  )
}
