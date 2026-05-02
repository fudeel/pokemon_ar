// game-development-frontend/lib/spawner/GeoUtils.ts

import type { GeoLocation } from '@/types'

/** Haversine distance in metres between two geo-coordinates. */
export function distanceMeters(a: GeoLocation, b: GeoLocation): number {
  const R = 6_371_000
  const φ1 = (a.latitude * Math.PI) / 180
  const φ2 = (b.latitude * Math.PI) / 180
  const Δφ = ((b.latitude - a.latitude) * Math.PI) / 180
  const Δλ = ((b.longitude - a.longitude) * Math.PI) / 180
  const sin2 =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(sin2), Math.sqrt(1 - sin2))
}

/**
 * Returns a uniformly-distributed random point inside a circle defined by
 * `center` and `radiusMeters`.
 */
export function randomPointInCircle(
  center: GeoLocation,
  radiusMeters: number,
): GeoLocation {
  const r = radiusMeters * Math.sqrt(Math.random())
  const θ = Math.random() * 2 * Math.PI
  const latDelta = (r * Math.cos(θ)) / 111_320
  const lngDelta =
    (r * Math.sin(θ)) /
    (111_320 * Math.cos((center.latitude * Math.PI) / 180))
  return {
    latitude: center.latitude + latDelta,
    longitude: center.longitude + lngDelta,
  }
}

/**
 * Moves a position by `metersLat` north and `metersLng` east.
 * Used for WASD keyboard simulation.
 */
export function offsetPosition(
  pos: GeoLocation,
  metersLat: number,
  metersLng: number,
): GeoLocation {
  const latDelta = metersLat / 111_320
  const lngDelta =
    metersLng / (111_320 * Math.cos((pos.latitude * Math.PI) / 180))
  return {
    latitude: pos.latitude + latDelta,
    longitude: pos.longitude + lngDelta,
  }
}
