// game-development-frontend/components/game/GameWorldLoader.tsx

'use client'

import { useEffect, useRef } from 'react'

import { useWorld } from '@/context/WorldContext'
import { usePlayerLocation } from '@/hooks/usePlayerLocation'

import ErrorMessage from '@/components/ui/ErrorMessage'
import LoadingScreen from '@/components/ui/LoadingScreen'
import GameScreen from './GameScreen'

export default function GameWorldLoader() {
  const { snapshot, isLoading, error, fetchSnapshot } = useWorld()
  const { position, gpsUnavailable } = usePlayerLocation()
  const requestedInitialSnapshotRef = useRef(false)

  useEffect(() => {
    if (!position || requestedInitialSnapshotRef.current) return

    requestedInitialSnapshotRef.current = true
    fetchSnapshot({
      latitude: position.latitude,
      longitude: position.longitude,
    })
  }, [position, fetchSnapshot])

  if (!position) return <LoadingScreen message="Acquiring position..." />

  if (!snapshot && isLoading) {
    return <LoadingScreen message="Loading world data..." />
  }

  if (!snapshot && error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-900 p-4">
        <div className="w-full max-w-md">
          <ErrorMessage message={error} />
        </div>
      </div>
    )
  }

  if (!snapshot) return <LoadingScreen message="Loading world data..." />

  return (
    <GameScreen
      position={position}
      gpsUnavailable={gpsUnavailable}
    />
  )
}
