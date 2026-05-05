// game-development-frontend/components/entry/starter-map/starterPlacement.ts

import { offsetPosition } from '@/lib/spawner/GeoUtils'
import type { GeoLocation, PokemonSpecies } from '@/types'

const STARTER_DISTANCE_METERS = 60

export interface PlacedStarter {
  species: PokemonSpecies
  location: GeoLocation
}

/**
 * Places starter species evenly around the player at a fixed walking distance.
 * Deterministic based on the centre — re-renders don't shuffle the layout.
 */
export function placeStartersAroundPlayer(
  starters: PokemonSpecies[],
  center: GeoLocation,
  distanceMeters = STARTER_DISTANCE_METERS,
): PlacedStarter[] {
  if (starters.length === 0) return []
  const angleStep = (2 * Math.PI) / starters.length

  return starters.map((species, index) => {
    const θ = index * angleStep - Math.PI / 2 // first one points north
    const dLat = distanceMeters * Math.sin(θ)
    const dLng = distanceMeters * Math.cos(θ)
    return {
      species,
      location: offsetPosition(center, dLat, dLng),
    }
  })
}
