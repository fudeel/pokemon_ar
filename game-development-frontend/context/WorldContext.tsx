// game-development-frontend/context/WorldContext.tsx

'use client'

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { worldApi } from '@/lib/api/world'
import { generateSpawns } from '@/lib/spawner/SpawnEngine'
import { distanceMeters } from '@/lib/spawner/GeoUtils'
import type {
  GeoLocation,
  SpawnedPokemon,
  WorldSnapshotResponse,
} from '@/types'

const REFRESH_DISTANCE_METERS = 300
const REFRESH_INTERVAL_MS = 45_000

interface WorldContextValue {
  snapshot: WorldSnapshotResponse | null
  spawnedPokemon: SpawnedPokemon[]
  isLoading: boolean
  error: string | null
  fetchSnapshot: (location: GeoLocation) => Promise<void>
  revealPokemon: (clientId: string) => void
  removePokemon: (clientId: string) => void
}

const WorldContext = createContext<WorldContextValue | null>(null)

export function WorldProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<WorldSnapshotResponse | null>(null)
  const [spawnedPokemon, setSpawnedPokemon] = useState<SpawnedPokemon[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lastFetchLocationRef = useRef<GeoLocation | null>(null)
  const lastFetchTimeRef = useRef<number>(0)
  const spawnedAreaIdsRef = useRef<Set<number>>(new Set())

  const fetchSnapshot = useCallback(async (location: GeoLocation) => {
    const now = Date.now()
    const lastLoc = lastFetchLocationRef.current
    const timeSinceLast = now - lastFetchTimeRef.current

    const tooClose =
      lastLoc &&
      distanceMeters(lastLoc, location) < REFRESH_DISTANCE_METERS &&
      timeSinceLast < REFRESH_INTERVAL_MS

    if (tooClose) return

    setIsLoading(true)
    setError(null)

    try {
      const data = await worldApi.snapshot(location)
      setSnapshot(data)

      const newSpawns = generateSpawns(data.spawn_areas, spawnedAreaIdsRef.current)
      data.spawn_areas.forEach((a) => spawnedAreaIdsRef.current.add(a.id))
      setSpawnedPokemon((prev) => [...prev, ...newSpawns])

      lastFetchLocationRef.current = location
      lastFetchTimeRef.current = now
    } catch (e) {
      setError(e instanceof Error ? e.message : 'World load failed.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const revealPokemon = useCallback((clientId: string) => {
    setSpawnedPokemon((prev) =>
      prev.map((p) => (p.clientId === clientId ? { ...p, isRevealed: true } : p)),
    )
  }, [])

  const removePokemon = useCallback((clientId: string) => {
    setSpawnedPokemon((prev) => prev.filter((p) => p.clientId !== clientId))
  }, [])

  return (
    <WorldContext.Provider
      value={{
        snapshot,
        spawnedPokemon,
        isLoading,
        error,
        fetchSnapshot,
        revealPokemon,
        removePokemon,
      }}
    >
      {children}
    </WorldContext.Provider>
  )
}

export function useWorld(): WorldContextValue {
  const ctx = useContext(WorldContext)
  if (!ctx) throw new Error('useWorld must be used inside WorldProvider')
  return ctx
}
