// game-development-frontend/lib/api/player.ts

import { apiClient } from './client'
import type { PlayerProfile, PokemonInstance, PokemonSpecies } from '@/types'

export const playerApi = {
  getProfile: () => apiClient.get<PlayerProfile>('/me/profile'),

  listStarters: () => apiClient.get<PokemonSpecies[]>('/me/starters'),

  chooseStarter: (speciesId: number) =>
    apiClient.post<PokemonInstance>('/me/starter', { species_id: speciesId }),
}
