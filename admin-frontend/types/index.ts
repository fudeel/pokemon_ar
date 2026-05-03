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

export interface Move {
  id: number
  name: string
  type: string
  category: 'physical' | 'special' | 'status'
  power: number | null
  accuracy: number | null
  pp: number
}

export interface LearnableMove {
  move: Move
  learn_level: number
}

export const ITEM_CATEGORIES = ['pokeball', 'potion', 'revive', 'key', 'misc'] as const
export type ItemCategory = typeof ITEM_CATEGORIES[number]

export const ITEM_EFFECT_OPERATIONS = ['set', 'delta'] as const
export type ItemEffectOperation = typeof ITEM_EFFECT_OPERATIONS[number]

export type ItemEffectValue = boolean | number | string | null

export interface ItemEffect {
  target: string
  attribute: string
  operation: ItemEffectOperation
  value: ItemEffectValue
}

export interface Item {
  id: number
  name: string
  category: ItemCategory
  description: string
  buy_price: number | null
  sell_price: number | null
  effect: ItemEffect | null
  stackable: boolean
}

export const NERF_KEYS = [
  'venom_poison',
  'badly_poisoned',
  'burn',
  'paralysis',
  'freeze',
  'sleep',
  'confusion',
] as const
export type NerfKey = typeof NERF_KEYS[number]
export type Nerfs = Record<NerfKey, boolean | null>

export const QUEST_OBJECTIVE_TYPES = [
  'gather_item',
  'defeat_wild_pokemon',
  'defeat_trainer',
  'deliver_item',
  'talk_to_npc',
  'explore_area',
  'catch_pokemon',
  'escort_npc',
  'reach_level',
] as const
export type QuestObjectiveType = typeof QUEST_OBJECTIVE_TYPES[number]

export const QUEST_OBJECTIVE_LABELS: Record<QuestObjectiveType, string> = {
  gather_item: 'Gather items',
  defeat_wild_pokemon: 'Defeat wild Pokémon',
  defeat_trainer: 'Defeat NPC trainer',
  deliver_item: 'Deliver item to NPC',
  talk_to_npc: 'Talk to NPC',
  explore_area: 'Explore area',
  catch_pokemon: 'Catch Pokémon',
  escort_npc: 'Escort NPC',
  reach_level: 'Reach player level',
}

export interface QuestObjective {
  id: number
  order: number
  objective_type: QuestObjectiveType
  description: string
  target_quantity: number
  target_item_id: number | null
  target_species_id: number | null
  target_pokemon_type: string | null
  target_npc_id: number | null
  target_lat: number | null
  target_lng: number | null
  target_radius_meters: number | null
  target_level: number | null
}

export interface QuestItemReward {
  item_id: number
  item_name: string
  quantity: number
}

export interface QuestReward {
  pokecoins: number
  experience: number
  items: QuestItemReward[]
}

export interface Quest {
  id: number
  title: string
  description: string
  minimum_level: number
  time_limit_seconds: number | null
  is_repeatable: boolean
  follow_up_quest_id: number | null
  objectives: QuestObjective[]
  reward: QuestReward
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
  | 'world_item'
  | 'item_spawn_area'

export interface WorldItemSpawn {
  id: number
  item_id: number
  item_name: string
  item_category: string
  quantity: number
  location: GeoLocation
  is_hidden: boolean
  expires_at: string | null
}

export interface ItemSpawnAreaItem {
  item_id: number
  item_name: string
  item_category: string
  spawn_chance: number
  max_quantity: number
}

export interface ItemSpawnArea {
  id: number
  name: string
  center: GeoLocation
  radius_meters: number
  items: ItemSpawnAreaItem[]
}

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
