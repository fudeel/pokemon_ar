// admin-frontend/types/index.ts

export interface GeoLocation {
  latitude: number
  longitude: number
}

export interface BaseStats {
  hp: number
  attack: number
  defense: number
  special_attack: number
  special_defense: number
  speed: number
}

export interface PokemonSpecies {
  id: number
  name: string
  primary_type: string
  secondary_type: string | null
  base_stats: BaseStats
  capture_rate: number
  base_experience: number
  is_starter: boolean
  is_rare: boolean
}

export interface MapObject {
  id: number
  kind: string
  name: string | null
  location: GeoLocation
  metadata: Record<string, unknown>
}

export interface Npc {
  id: number
  name: string
  role: string
  location: GeoLocation
  dialogue: string | null
  metadata: Record<string, unknown>
}

export interface SpawnAreaPokemon {
  species_id: number
  species_name: string
  spawn_chance: number
}

export interface SpawnArea {
  id: number
  name: string
  center: GeoLocation
  radius_meters: number
  pokemon: SpawnAreaPokemon[]
}

export interface EventArea {
  id: number
  name: string
  description: string | null
  center: GeoLocation
  radius_meters: number
  starts_at: string
  ends_at: string
  metadata: Record<string, unknown>
}

export interface GymDefender {
  slot: number
  pokemon_instance_id: number
  effective_level: number
}

export interface Gym {
  id: number
  name: string
  location: GeoLocation
  current_leader_player_id: number | null
  leader_since: string | null
  defenders: GymDefender[]
}

export interface RareWildPokemon {
  id: number
  species_id: number
  species_name: string
  level: number
  current_hp: number
  location: GeoLocation
  expires_at: string | null
}

export interface AdminToken {
  token: string
  expires_at: string
}

export type EntityType =
  | 'map_object'
  | 'npc'
  | 'spawn_area'
  | 'event_area'
  | 'gym'
  | 'rare_pokemon'

export const POKEMON_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
] as const

export type PokemonType = typeof POKEMON_TYPES[number]

export const NPC_ROLES = [
  'merchant', 'healer', 'questgiver', 'trainer', 'auctioneer',
] as const

export type NpcRole = typeof NPC_ROLES[number]

export const MAP_OBJECT_KINDS = [
  'pokestop', 'landmark', 'shop', 'pokemon_center', 'quest_board', 'auction_house',
] as const

export const TYPE_COLORS: Record<string, string> = {
  normal: '#a8a77a',
  fire: '#ee8130',
  water: '#6390f0',
  electric: '#f7d02c',
  grass: '#7ac74c',
  ice: '#96d9d6',
  fighting: '#c22e28',
  poison: '#a33ea1',
  ground: '#e2bf65',
  flying: '#a98ff3',
  psychic: '#f95587',
  bug: '#a6b91a',
  rock: '#b6a136',
  ghost: '#735797',
  dragon: '#6f35fc',
  dark: '#705746',
  steel: '#b7b7ce',
  fairy: '#d685ad',
}
