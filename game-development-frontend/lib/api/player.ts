// game-development-frontend/lib/api/player.ts

import { apiClient } from './client'
import type {
  GeoLocation,
  PlayerProfile,
  PokemonInstance,
  PokemonSpecies,
  WorldItemSpawn,
} from '@/types'

export const playerApi = {
  getProfile: () => apiClient.get<PlayerProfile>('/me/profile'),

  listStarters: () => apiClient.get<PokemonSpecies[]>('/me/starters'),

  chooseStarter: (speciesId: number) =>
    apiClient.post<PokemonInstance>('/me/starter', { species_id: speciesId }),

  collectWorldItem: (worldItemSpawnId: number, location: GeoLocation) =>
    apiClient.post<WorldItemSpawn>('/me/collect-world-item', {
      world_item_spawn_id: worldItemSpawnId,
      location,
    }),
}
