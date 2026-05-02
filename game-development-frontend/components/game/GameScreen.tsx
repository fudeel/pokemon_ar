// game-development-frontend/components/game/GameScreen.tsx

'use client'

import { useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'

import { usePlayer } from '@/context/PlayerContext'
import { useWorld } from '@/context/WorldContext'
import { usePlayerLocation } from '@/hooks/usePlayerLocation'

import GameHud from './GameHud'
import BattleEncounterScreen from './BattleEncounterScreen'
import LoadingScreen from '@/components/ui/LoadingScreen'
import ErrorMessage from '@/components/ui/ErrorMessage'

import { useState } from 'react'
import type { ActiveEncounter } from '@/types'

const GameMap = dynamic(() => import('./GameMap'), {
  ssr: false,
  loading: () => <LoadingScreen message="Loading map…" />,
})

const WORLD_REFRESH_INTERVAL_MS = 45_000

export default function GameScreen() {
  const { profile, refreshProfile } = usePlayer()
  const { snapshot, spawnedPokemon, isLoading, error, fetchSnapshot, revealPokemon, removePokemon } =
    useWorld()
  const { position, gpsUnavailable } = usePlayerLocation()

  const [activeEncounter, setActiveEncounter] = useState<ActiveEncounter | null>(null)
  const lastFetchedRef = useRef<number>(0)

  // Fetch world snapshot when position is available and on interval
  useEffect(() => {
    if (!position) return

    const now = Date.now()
    if (now - lastFetchedRef.current < 5_000) return // debounce on first mount

    fetchSnapshot({ latitude: position.latitude, longitude: position.longitude })
    lastFetchedRef.current = now

    const interval = setInterval(() => {
      fetchSnapshot({ latitude: position.latitude, longitude: position.longitude })
    }, WORLD_REFRESH_INTERVAL_MS)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position?.latitude, position?.longitude])

  const handleCaptureSuccess = useCallback(
    (clientId?: string) => {
      if (clientId) removePokemon(clientId)
      setActiveEncounter(null)
      refreshProfile()
    },
    [removePokemon, refreshProfile],
  )

  if (!position) return <LoadingScreen message="Acquiring position…" />

  return (
    <div className="relative w-full h-full">
      <GameMap
        playerPosition={position}
        snapshot={snapshot}
        spawnedPokemon={spawnedPokemon}
        onRevealPokemon={revealPokemon}
        onEncounter={setActiveEncounter}
      />

      <GameHud
        profile={profile}
        position={position}
        isWorldLoading={isLoading}
        gpsUnavailable={gpsUnavailable}
      />

      {error && (
        <div className="absolute bottom-20 left-3 right-3 z-10">
          <ErrorMessage message={error} />
        </div>
      )}

      {activeEncounter && (
        <BattleEncounterScreen
          encounter={activeEncounter}
          profile={profile}
          onClose={() => setActiveEncounter(null)}
          onCaptureSuccess={handleCaptureSuccess}
        />
      )}
    </div>
  )
}
