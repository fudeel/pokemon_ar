// game-development-frontend/components/game/polygonUtils.ts

import type { GeoLocation } from '@/types'

/** Converts polygon vertices to Leaflet's [lat, lng] tuple format. */
export function toLatLngTuples(polygon: GeoLocation[]): [number, number][] {
  return polygon.map((p) => [p.latitude, p.longitude])
}
