// game-development-frontend/lib/spawner/SpawnEngine.ts

import type {
  GeoLocation,
  SpawnArea,
  SpawnAreaPokemon,
  SpawnedPokemon,
} from '@/types'
import {
  distanceMeters,
  pointInPolygon,
  polygonAreaMeters2,
  polygonBoundingBox,
} from './GeoUtils'

/** Pokemon are spawned at points within this radius of the player. */
export const ACTIVE_SPAWN_RADIUS_METERS = 120

/** Steady-state target of pokemon kept around the player. */
export const TARGET_VISIBLE_POKEMON = 12

/** Cap how many pokemon may be added in a single tick to avoid bursts. */
const MAX_SPAWNS_PER_TICK = 4

/** Rejection-sampling budget for placing one pokemon. */
const MAX_PLACEMENT_ATTEMPTS = 40

function weightedPick<T>(items: T[], weight: (item: T) => number): T {
  const total = items.reduce((s, i) => s + weight(i), 0)
  let roll = Math.random() * total
  for (const item of items) {
    roll -= weight(item)
    if (roll <= 0) return item
  }
  return items[items.length - 1]
}

function rollLevel(): number {
  return Math.floor(Math.random() * 12) + 2 // 2–13
}

/** Quick test: does this polygon overlap a circle around the player? */
function polygonOverlapsCircle(
  polygon: GeoLocation[],
  center: GeoLocation,
  radius: number,
): boolean {
  if (polygon.length < 3) return false
  if (pointInPolygon(center, polygon)) return true
  for (const v of polygon) {
    if (distanceMeters(center, v) <= radius) return true
  }
  return false
}

/**
 * Picks a random point that is BOTH inside the polygon AND within `radius` of
 * the player. Returns null if no point is found within the attempt budget.
 */
function placeWithinPolygonAndRadius(
  polygon: GeoLocation[],
  player: GeoLocation,
  radius: number,
): GeoLocation | null {
  const bbox = polygonBoundingBox(polygon)
  for (let i = 0; i < MAX_PLACEMENT_ATTEMPTS; i += 1) {
    const candidate: GeoLocation = {
      latitude: bbox.minLat + Math.random() * (bbox.maxLat - bbox.minLat),
      longitude: bbox.minLng + Math.random() * (bbox.maxLng - bbox.minLng),
    }
    if (
      pointInPolygon(candidate, polygon) &&
      distanceMeters(player, candidate) <= radius
    ) {
      return candidate
    }
  }
  return null
}

function buildSpawn(
  area: SpawnArea,
  species: SpawnAreaPokemon,
  location: GeoLocation,
): SpawnedPokemon {
  return {
    clientId: crypto.randomUUID(),
    speciesId: species.species_id,
    speciesName: species.species_name,
    spawnAreaId: area.id,
    location,
    isRevealed: false,
    level: rollLevel(),
  }
}

/**
 * Tops up the pokemon population around the player toward `target`.
 * Spawns are placed within both their spawn area's polygon and the active
 * radius around the player, so they never appear out-of-range.
 */
export function spawnUpTo(
  areas: SpawnArea[],
  existing: SpawnedPokemon[],
  player: GeoLocation,
  target: number = TARGET_VISIBLE_POKEMON,
): SpawnedPokemon[] {
  const reachableAreas = areas.filter(
    (a) =>
      a.pokemon.length > 0 &&
      a.polygon.length >= 3 &&
      polygonOverlapsCircle(a.polygon, player, ACTIVE_SPAWN_RADIUS_METERS),
  )
  if (reachableAreas.length === 0) return []

  const visibleCount = existing.reduce(
    (n, p) =>
      distanceMeters(player, p.location) <= ACTIVE_SPAWN_RADIUS_METERS
        ? n + 1
        : n,
    0,
  )
  const needed = Math.min(MAX_SPAWNS_PER_TICK, target - visibleCount)
  if (needed <= 0) return []

  const spawns: SpawnedPokemon[] = []
  for (let i = 0; i < needed; i += 1) {
    const area = weightedPick(reachableAreas, (a) =>
      Math.max(polygonAreaMeters2(a.polygon), 1),
    )
    const location = placeWithinPolygonAndRadius(
      area.polygon,
      player,
      ACTIVE_SPAWN_RADIUS_METERS,
    )
    if (!location) continue
    const species = weightedPick(area.pokemon, (p) => p.spawn_chance)
    spawns.push(buildSpawn(area, species, location))
  }
  return spawns
}
