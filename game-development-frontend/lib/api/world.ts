// game-development-frontend/lib/api/world.ts

import { apiClient } from './client'
import type { GeoLocation, WorldSnapshotResponse } from '@/types'

const SNAPSHOT_RADIUS_METERS = 1000

export const worldApi = {
  snapshot: (location: GeoLocation, radiusMeters = SNAPSHOT_RADIUS_METERS) =>
    apiClient.post<WorldSnapshotResponse>('/world/snapshot', {
      location,
      radius_meters: radiusMeters,
    }),
}
