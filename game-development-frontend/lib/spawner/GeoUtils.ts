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

export interface BoundingBox {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

/** Bounding box of a polygon (caller must guarantee non-empty). */
export function polygonBoundingBox(polygon: GeoLocation[]): BoundingBox {
  let minLat = polygon[0].latitude
  let maxLat = polygon[0].latitude
  let minLng = polygon[0].longitude
  let maxLng = polygon[0].longitude
  for (let i = 1; i < polygon.length; i += 1) {
    const p = polygon[i]
    if (p.latitude < minLat) minLat = p.latitude
    if (p.latitude > maxLat) maxLat = p.latitude
    if (p.longitude < minLng) minLng = p.longitude
    if (p.longitude > maxLng) maxLng = p.longitude
  }
  return { minLat, maxLat, minLng, maxLng }
}

/** Ray-casting point-in-polygon test (lat/lng treated as planar). */
export function pointInPolygon(
  point: GeoLocation,
  polygon: GeoLocation[],
): boolean {
  let inside = false
  const x = point.longitude
  const y = point.latitude
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i].longitude
    const yi = polygon[i].latitude
    const xj = polygon[j].longitude
    const yj = polygon[j].latitude
    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-18) + xi
    if (intersect) inside = !inside
  }
  return inside
}

/**
 * Polygon centroid (planar approximation). Falls back to vertex average for
 * degenerate (zero-area) inputs.
 */
export function polygonCentroid(polygon: GeoLocation[]): GeoLocation {
  const n = polygon.length
  if (n === 0) throw new Error('empty polygon')
  if (n < 3) {
    const lat = polygon.reduce((s, p) => s + p.latitude, 0) / n
    const lng = polygon.reduce((s, p) => s + p.longitude, 0) / n
    return { latitude: lat, longitude: lng }
  }

  let area2 = 0
  let cx = 0
  let cy = 0
  for (let i = 0; i < n; i += 1) {
    const a = polygon[i]
    const b = polygon[(i + 1) % n]
    const cross = a.longitude * b.latitude - b.longitude * a.latitude
    area2 += cross
    cx += (a.longitude + b.longitude) * cross
    cy += (a.latitude + b.latitude) * cross
  }

  if (Math.abs(area2) < 1e-15) {
    const lat = polygon.reduce((s, p) => s + p.latitude, 0) / n
    const lng = polygon.reduce((s, p) => s + p.longitude, 0) / n
    return { latitude: lat, longitude: lng }
  }

  return {
    latitude: cy / (3 * area2),
    longitude: cx / (3 * area2),
  }
}

/**
 * Uniformly samples a random point inside a polygon using rejection sampling
 * over the bounding box. Falls back to the centroid after `maxAttempts`.
 */
export function randomPointInPolygon(
  polygon: GeoLocation[],
  maxAttempts = 32,
): GeoLocation {
  const bbox = polygonBoundingBox(polygon)
  for (let i = 0; i < maxAttempts; i += 1) {
    const candidate: GeoLocation = {
      latitude: bbox.minLat + Math.random() * (bbox.maxLat - bbox.minLat),
      longitude: bbox.minLng + Math.random() * (bbox.maxLng - bbox.minLng),
    }
    if (pointInPolygon(candidate, polygon)) return candidate
  }
  return polygonCentroid(polygon)
}

/** Approximate planar area of a polygon converted to square metres. */
export function polygonAreaMeters2(polygon: GeoLocation[]): number {
  const n = polygon.length
  if (n < 3) return 0
  const meanLatRad =
    (polygon.reduce((s, p) => s + p.latitude, 0) / n) * (Math.PI / 180)
  const mPerDegLat = 111_320
  const mPerDegLng = 111_320 * Math.cos(meanLatRad)

  let area2 = 0
  for (let i = 0; i < n; i += 1) {
    const a = polygon[i]
    const b = polygon[(i + 1) % n]
    const ax = a.longitude * mPerDegLng
    const ay = a.latitude * mPerDegLat
    const bx = b.longitude * mPerDegLng
    const by = b.latitude * mPerDegLat
    area2 += ax * by - bx * ay
  }
  return Math.abs(area2) / 2
}
