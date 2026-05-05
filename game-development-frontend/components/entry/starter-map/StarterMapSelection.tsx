// game-development-frontend/components/entry/starter-map/StarterMapSelection.tsx

'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'

import { playerApi } from '@/lib/api/player'
import { usePlayer } from '@/context/PlayerContext'
import { usePlayerLocation } from '@/hooks/usePlayerLocation'

import LoadingScreen from '@/components/ui/LoadingScreen'
import ErrorMessage from '@/components/ui/ErrorMessage'

import { placeStartersAroundPlayer, type PlacedStarter } from './starterPlacement'
import type { GeoLocation, PokemonSpecies } from '@/types'

const StarterMap = dynamic(() => import('./StarterMap'), {
  ssr: false,
  loading: () => <LoadingScreen message="Loading map…" />,
})

interface StarterMapSelectionProps {
  onStarterChosen: () => void
}

interface StoredPlacement {
  center: GeoLocation
  starters: { species_id: number; location: GeoLocation }[]
}

function placementStorageKey(playerId: number): string {
  return `pokemon_starter_placement_${playerId}`
}

function loadStoredPlacement(playerId: number): StoredPlacement | null {
  try {
    const raw = localStorage.getItem(placementStorageKey(playerId))
    return raw ? (JSON.parse(raw) as StoredPlacement) : null
  } catch {
    return null
  }
}

function persistPlacement(playerId: number, payload: StoredPlacement): void {
  localStorage.setItem(placementStorageKey(playerId), JSON.stringify(payload))
}

function clearPlacement(playerId: number): void {
  localStorage.removeItem(placementStorageKey(playerId))
}

export default function StarterMapSelection({
  onStarterChosen,
}: StarterMapSelectionProps) {
  const { session, updateSession, refreshProfile } = usePlayer()
  const { position, gpsUnavailable } = usePlayerLocation()

  const [starters, setStarters] = useState<PokemonSpecies[]>([])
  const [isLoadingStarters, setIsLoadingStarters] = useState(true)
  const [confirmingSpeciesId, setConfirmingSpeciesId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [placements, setPlacements] = useState<PlacedStarter[]>([])

  useEffect(() => {
    playerApi
      .listStarters()
      .then(setStarters)
      .catch((e) =>
        setError(e instanceof Error ? e.message : 'Could not load starters.'),
      )
      .finally(() => setIsLoadingStarters(false))
  }, [])

  // Decide placement once: prefer stored, else compute from current position.
  useEffect(() => {
    if (!session || starters.length === 0 || !position) return
    if (placements.length > 0) return

    const stored = loadStoredPlacement(session.player_id)
    if (stored) {
      const speciesById = new Map(starters.map((s) => [s.id, s]))
      const restored: PlacedStarter[] = stored.starters
        .map((entry) => {
          const species = speciesById.get(entry.species_id)
          return species ? { species, location: entry.location } : null
        })
        .filter((p): p is PlacedStarter => p !== null)

      if (restored.length === starters.length) {
        setPlacements(restored)
        return
      }
    }

    const fresh = placeStartersAroundPlayer(starters, {
      latitude: position.latitude,
      longitude: position.longitude,
    })
    setPlacements(fresh)
    persistPlacement(session.player_id, {
      center: { latitude: position.latitude, longitude: position.longitude },
      starters: fresh.map((p) => ({
        species_id: p.species.id,
        location: p.location,
      })),
    })
  }, [session, starters, position, placements.length])

  const handleChoose = useMemo(
    () => async (speciesId: number) => {
      if (!session || confirmingSpeciesId !== null) return
      setConfirmingSpeciesId(speciesId)
      setError(null)
      try {
        await playerApi.chooseStarter(speciesId)
        updateSession({ has_chosen_starter: true })
        await refreshProfile()
        clearPlacement(session.player_id)
        onStarterChosen()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not choose starter.')
        setConfirmingSpeciesId(null)
      }
    },
    [session, confirmingSpeciesId, updateSession, refreshProfile, onStarterChosen],
  )

  if (isLoadingStarters || starters.length === 0) {
    return <LoadingScreen message="Preparing your starters…" />
  }

  if (!position) return <LoadingScreen message="Acquiring position…" />

  return (
    <div className="relative w-full h-full">
      <StarterMap
        playerPosition={position}
        placements={placements}
        confirmingSpeciesId={confirmingSpeciesId}
        onChoose={handleChoose}
      />

      {/* Top banner */}
      <div className="absolute top-3 left-3 right-3 z-10 pointer-events-none">
        <div className="bg-slate-900/85 backdrop-blur border border-yellow-500/60 rounded-xl px-4 py-3 text-center">
          <p className="text-yellow-400 font-bold text-sm uppercase tracking-widest">
            Choose your starter
          </p>
          <p className="text-slate-300 text-xs mt-0.5">
            Walk to one of the Pokéballs on the map and tap it to claim your partner.
          </p>
        </div>
      </div>

      {/* Mode indicator */}
      <div className="absolute bottom-3 right-3 z-10 pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur border border-slate-700 rounded-xl px-3 py-2 flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              gpsUnavailable ? 'bg-yellow-400' : 'bg-green-400'
            }`}
          />
          <span className="text-slate-300 text-xs">
            {gpsUnavailable ? 'WASD' : 'GPS'}
          </span>
        </div>
      </div>

      {error && (
        <div className="absolute bottom-20 left-3 right-3 z-10">
          <ErrorMessage message={error} onDismiss={() => setError(null)} />
        </div>
      )}
    </div>
  )
}
