// game-development-frontend/lib/spawner/SpawnEngine.ts

import type {
  GeoLocation,
  SpawnArea,
  SpawnAreaPokemon,
  SpawnedPokemon,
} from '@/types'
import {
  pointInPolygon,
  polygonAreaMeters2,
  randomPointInPolygon,
} from './GeoUtils'

const MIN_SPAWNS_PER_AREA = 3
const MAX_SPAWNS_PER_AREA = 12
const AREA_DENSITY_DIVISOR = 4_000 // 1 pokemon per N square metres

/** Selects one species from the list using spawn_chance as relative weight. */
function weightedRandom(entries: SpawnAreaPokemon[]): SpawnAreaPokemon {
  const totalWeight = entries.reduce((s, e) => s + e.spawn_chance, 0)
  let roll = Math.random() * totalWeight
  for (const entry of entries) {
    roll -= entry.spawn_chance
    if (roll <= 0) return entry
  }
  return entries[entries.length - 1]
}

/** Generates a random encounter level appropriate for a common wild pokemon. */
function rollLevel(): number {
  return Math.floor(Math.random() * 12) + 2 // 2–13
}

/** Spawns client-side pokemon for a single (polygonal) spawn area. */
function spawnFromArea(area: SpawnArea): SpawnedPokemon[] {
  if (area.pokemon.length === 0) return []
  if (area.polygon.length < 3) return []

  const areaM2 = polygonAreaMeters2(area.polygon)
  const count = Math.min(
    MAX_SPAWNS_PER_AREA,
    Math.max(MIN_SPAWNS_PER_AREA, Math.floor(areaM2 / AREA_DENSITY_DIVISOR)),
  )

  return Array.from({ length: count }, () => {
    const species = weightedRandom(area.pokemon)
    const location = randomPointInPolygon(area.polygon)
    return {
      clientId: crypto.randomUUID(),
      speciesId: species.species_id,
      speciesName: species.species_name,
      spawnAreaId: area.id,
      location,
      isRevealed: false,
      level: rollLevel(),
    } satisfies SpawnedPokemon
  })
}

/**
 * Generates client-side pokemon spawns for all provided spawn areas.
 * Already-spawned area IDs are skipped so refreshes don't duplicate.
 */
export function generateSpawns(
  areas: SpawnArea[],
  alreadySpawnedAreaIds: Set<number>,
  playerLocation: GeoLocation,
): SpawnedPokemon[] {
  return areas
    .filter((a) => !alreadySpawnedAreaIds.has(a.id))
    .filter((a) => pointInPolygon(playerLocation, a.polygon))
    .flatMap(spawnFromArea)
}
