// game-development-frontend/context/WorldContext.tsx

'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { worldApi } from '@/lib/api/world'
import { spawnUpTo } from '@/lib/spawner/SpawnEngine'
import { distanceMeters } from '@/lib/spawner/GeoUtils'
import type {
  GeoLocation,
  SpawnedPokemon,
  WorldSnapshotResponse,
} from '@/types'

const REFRESH_DISTANCE_METERS = 100
const REFRESH_INTERVAL_MS = 45_000
const SPAWN_TICK_MS = 1_500
const DESPAWN_RADIUS_METERS = 150

interface WorldContextValue {
  snapshot: WorldSnapshotResponse | null
  spawnedPokemon: SpawnedPokemon[]
  isLoading: boolean
  error: string | null
  fetchSnapshot: (location: GeoLocation) => Promise<void>
  revealPokemon: (clientId: string) => void
  removePokemon: (clientId: string) => void
  despawnByDistance: (playerLocation: GeoLocation) => void
  removeWorldItem: (worldItemId: number) => void
}

const WorldContext = createContext<WorldContextValue | null>(null)

export function WorldProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<WorldSnapshotResponse | null>(null)
  const [spawnedPokemon, setSpawnedPokemon] = useState<SpawnedPokemon[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lastFetchLocationRef = useRef<GeoLocation | null>(null)
  const lastFetchTimeRef = useRef<number>(0)
  const currentSnapshotRef = useRef<WorldSnapshotResponse | null>(null)
  const currentLocationRef = useRef<GeoLocation | null>(null)

  const topUpSpawns = useCallback(() => {
    const snap = currentSnapshotRef.current
    const loc = currentLocationRef.current
    if (!snap || !loc) return
    setSpawnedPokemon((prev) => {
      const fresh = spawnUpTo(snap.spawn_areas, prev, loc)
      return fresh.length === 0 ? prev : [...prev, ...fresh]
    })
  }, [])

  const fetchSnapshot = useCallback(
    async (location: GeoLocation) => {
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
        currentSnapshotRef.current = data
        currentLocationRef.current = location
        lastFetchLocationRef.current = location
        lastFetchTimeRef.current = now
        topUpSpawns()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'World load failed.')
      } finally {
        setIsLoading(false)
      }
    },
    [topUpSpawns],
  )

  const revealPokemon = useCallback((clientId: string) => {
    setSpawnedPokemon((prev) =>
      prev.map((p) => (p.clientId === clientId ? { ...p, isRevealed: true } : p)),
    )
  }, [])

  const removePokemon = useCallback((clientId: string) => {
    setSpawnedPokemon((prev) => prev.filter((p) => p.clientId !== clientId))
  }, [])

  const despawnByDistance = useCallback((playerLocation: GeoLocation) => {
    currentLocationRef.current = playerLocation
    setSpawnedPokemon((prev) => {
      const next = prev.filter(
        (p) => distanceMeters(playerLocation, p.location) <= DESPAWN_RADIUS_METERS,
      )
      return next.length === prev.length ? prev : next
    })
  }, [])

  // Steady-state population control: every tick, top up to the target count.
  useEffect(() => {
    const id = setInterval(topUpSpawns, SPAWN_TICK_MS)
    return () => clearInterval(id)
  }, [topUpSpawns])

  const removeWorldItem = useCallback((worldItemId: number) => {
    setSnapshot((prev) =>
      prev
        ? {
            ...prev,
            world_item_spawns: prev.world_item_spawns.filter((i) => i.id !== worldItemId),
          }
        : prev,
    )
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
        despawnByDistance,
        removeWorldItem,
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
