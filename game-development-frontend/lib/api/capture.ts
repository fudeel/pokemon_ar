// game-development-frontend/lib/api/capture.ts

import { apiClient } from './client'
import type { GeoLocation, PokemonInstance } from '@/types'

export interface RareCaptureResult {
  success: boolean
  rare_pokemon_id: number
  pokemon_instance: PokemonInstance | null
  remaining_pokeballs: number
}

export interface CommonCaptureResult {
  success: boolean
  pokemon_instance: PokemonInstance | null
  remaining_pokeballs: number
}

export const captureApi = {
  captureRare: (payload: {
    rare_pokemon_id: number
    pokeball_item_id: number
    player_location: GeoLocation
  }) => apiClient.post<RareCaptureResult>('/capture/rare', payload),

  captureCommon: (payload: {
    species_id: number
    level: number
    pokemon_current_hp: number
    pokemon_max_hp: number
    pokeball_item_id: number
    player_location: GeoLocation
  }) => apiClient.post<CommonCaptureResult>('/capture/common', payload),
}
