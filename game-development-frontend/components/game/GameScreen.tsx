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
  const { profile, refreshProfile } = usePlayer()
  const {
    snapshot,
    spawnedPokemon,
    isLoading,
    error,
    fetchSnapshot,
    revealPokemon,
    removeWorldItem,
  } = useWorld()

  const [activeEncounter, setActiveEncounter] = useState<ActiveEncounter | null>(null)
  const [pickupError, setPickupError] = useState<string | null>(null)
  const lastFetchedRef = useRef<number>(0)

  useEffect(() => {
    if (!position) return

    const now = Date.now()
    if (now - lastFetchedRef.current < 5_000) return

    fetchSnapshot({ latitude: position.latitude, longitude: position.longitude })
    lastFetchedRef.current = now

    const interval = setInterval(() => {
      fetchSnapshot({ latitude: position.latitude, longitude: position.longitude })
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
        onRevealPokemon={revealPokemon}
        onEncounter={setActiveEncounter}
        onPickupItem={handlePickupItem}
      />

      <GameHud
        profile={profile}
        position={position}
        isWorldLoading={isLoading}
        gpsUnavailable={gpsUnavailable}
      />

      {(error || pickupError) && (
        <div className="absolute bottom-20 left-3 right-3 z-10">
          <ErrorMessage
            message={pickupError ?? error ?? ''}
            onDismiss={pickupError ? () => setPickupError(null) : undefined}
          />
        </div>
      )}

      {activeEncounter && (
        <BattleEncounterScreen
          encounter={activeEncounter}
          profile={profile}
          onClose={() => setActiveEncounter(null)}
        />
      )}
    </div>
  )
}
