// admin-frontend/lib/api/admin.ts
import { apiClient } from './client'
import type {
  AdminToken,
  EventArea,
  Gym,
  Item,
  ItemEffect,
  ItemSpawnArea,
  LearnableMove,
  MapObject,
  Move,
  Npc,
  PokemonSpecies,
  Quest,
  RareWildPokemon,
  SpawnArea,
  WorldItemSpawn,
} from '@/types'

// ── Auth ──────────────────────────────────────────────────────────────────────

export function loginAdmin(username: string, password: string): Promise<AdminToken> {
  return apiClient.post('/admin/auth/login', { username, password })
}

// ── Species ───────────────────────────────────────────────────────────────────

export function listSpecies(): Promise<PokemonSpecies[]> {
  return apiClient.get('/admin/species')
}

export interface SpeciesUpsertPayload {
  id: number
  name: string
  primary_type: string
  secondary_type: string | null
  base_stats: {
    hp: number
    attack: number
    defense: number
    special_attack: number
    special_defense: number
    speed: number
  }
  capture_rate: number
  base_experience: number
  is_starter: boolean
  is_rare: boolean
}

export function upsertSpecies(payload: SpeciesUpsertPayload): Promise<PokemonSpecies> {
  return apiClient.put('/admin/species', payload)
}

// ── Moves ─────────────────────────────────────────────────────────────────────

export function listMoves(): Promise<Move[]> {
  return apiClient.get('/admin/moves')
}

export interface MoveUpsertPayload {
  name: string
  type: string
  category: string
  power: number | null
  accuracy: number | null
  pp: number
}

export function upsertMove(payload: MoveUpsertPayload): Promise<Move> {
  return apiClient.put('/admin/moves', payload)
}

export function deleteMove(id: number): Promise<void> {
  return apiClient.delete(`/admin/moves/${id}`)
}

export function listSpeciesMoves(speciesId: number): Promise<LearnableMove[]> {
  return apiClient.get(`/admin/species/${speciesId}/moves`)
}

export interface SpeciesMoveEntry {
  move_id: number
  learn_level: number
}

export function setSpeciesMoves(
  speciesId: number,
  moves: SpeciesMoveEntry[],
): Promise<LearnableMove[]> {
  return apiClient.put(`/admin/species/${speciesId}/moves`, { moves })
}

// ── Map Objects ───────────────────────────────────────────────────────────────

export function listMapObjects(): Promise<MapObject[]> {
  return apiClient.get('/admin/map-objects')
}

export interface MapObjectPayload {
  kind: string
  name: string | null
  location: { latitude: number; longitude: number }
  metadata: Record<string, unknown> | null
}

export function createMapObject(payload: MapObjectPayload): Promise<MapObject> {
  return apiClient.post('/admin/map-objects', payload)
}

export function deleteMapObject(id: number): Promise<void> {
  return apiClient.delete(`/admin/map-objects/${id}`)
}

// ── NPCs ──────────────────────────────────────────────────────────────────────

export function listNpcs(): Promise<Npc[]> {
  return apiClient.get('/admin/npcs')
}

export interface NpcPayload {
  name: string
  role: string
  location: { latitude: number; longitude: number }
  dialogue: string | null
  metadata: Record<string, unknown> | null
}

export function createNpc(payload: NpcPayload): Promise<Npc> {
  return apiClient.post('/admin/npcs', payload)
}

export function deleteNpc(id: number): Promise<void> {
  return apiClient.delete(`/admin/npcs/${id}`)
}

// ── Spawn Areas ───────────────────────────────────────────────────────────────

export function listSpawnAreas(): Promise<SpawnArea[]> {
  return apiClient.get('/admin/spawn-areas')
}

export interface SpawnAreaPokemonEntry {
  species_id: number
  spawn_chance: number
}

export interface SpawnAreaPayload {
  name: string
  center: { latitude: number; longitude: number }
  radius_meters: number
  pokemon: SpawnAreaPokemonEntry[]
}

export function createSpawnArea(payload: SpawnAreaPayload): Promise<SpawnArea> {
  return apiClient.post('/admin/spawn-areas', payload)
}

export function setSpawnAreaPokemon(
  id: number,
  pokemon: SpawnAreaPokemonEntry[],
): Promise<SpawnArea> {
  return apiClient.put(`/admin/spawn-areas/${id}/pokemon`, { pokemon })
}

export function deleteSpawnArea(id: number): Promise<void> {
  return apiClient.delete(`/admin/spawn-areas/${id}`)
}

// ── Event Areas ───────────────────────────────────────────────────────────────

export function listEventAreas(): Promise<EventArea[]> {
  return apiClient.get('/admin/event-areas')
}

export interface EventAreaPayload {
  name: string
  description: string | null
  center: { latitude: number; longitude: number }
  radius_meters: number
  starts_at: string
  ends_at: string
  metadata: Record<string, unknown> | null
}

export function createEventArea(payload: EventAreaPayload): Promise<EventArea> {
  return apiClient.post('/admin/event-areas', payload)
}

export function deleteEventArea(id: number): Promise<void> {
  return apiClient.delete(`/admin/event-areas/${id}`)
}

// ── Gyms ──────────────────────────────────────────────────────────────────────

export function listGyms(): Promise<Gym[]> {
  return apiClient.get('/admin/gyms')
}

export interface GymPayload {
  name: string
  location: { latitude: number; longitude: number }
}

export function createGym(payload: GymPayload): Promise<Gym> {
  return apiClient.post('/admin/gyms', payload)
}

export function deleteGym(id: number): Promise<void> {
  return apiClient.delete(`/admin/gyms/${id}`)
}

// ── Rare Wild Pokemon ─────────────────────────────────────────────────────────

export function listRarePokemon(): Promise<RareWildPokemon[]> {
  return apiClient.get('/admin/rare-wild-pokemon')
}

export interface RarePokemonPayload {
  species_id: number
  level: number
  location: { latitude: number; longitude: number }
  expires_at: string | null
}

export function createRarePokemon(payload: RarePokemonPayload): Promise<RareWildPokemon> {
  return apiClient.post('/admin/rare-wild-pokemon', payload)
}

export function deleteRarePokemon(id: number): Promise<void> {
  return apiClient.delete(`/admin/rare-wild-pokemon/${id}`)
}

// ── Items ─────────────────────────────────────────────────────────────────────

export function listItems(): Promise<Item[]> {
  return apiClient.get('/admin/items')
}

export interface ItemPayload {
  name: string
  category: string
  description: string
  buy_price: number | null
  sell_price: number | null
  effect: ItemEffect | null
  stackable: boolean
}

export function createItem(payload: ItemPayload): Promise<Item> {
  return apiClient.put('/admin/items', payload)
}

export function updateItem(id: number, payload: ItemPayload): Promise<Item> {
  return apiClient.put(`/admin/items/${id}`, payload)
}

export function deleteItem(id: number): Promise<void> {
  return apiClient.delete(`/admin/items/${id}`)
}

// ── Quests ────────────────────────────────────────────────────────────────────

export function listQuests(): Promise<Quest[]> {
  return apiClient.get('/admin/quests')
}

export function getQuest(id: number): Promise<Quest> {
  return apiClient.get(`/admin/quests/${id}`)
}

export interface QuestObjectivePayload {
  objective_type: string
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

export interface QuestItemRewardPayload {
  item_id: number
  quantity: number
}

export interface QuestPayload {
  title: string
  description: string
  minimum_level: number
  reward_pokecoins: number
  reward_experience: number
  time_limit_seconds: number | null
  is_repeatable: boolean
  follow_up_quest_id: number | null
  objectives: QuestObjectivePayload[]
  item_rewards: QuestItemRewardPayload[]
}

export function createQuest(payload: QuestPayload): Promise<Quest> {
  return apiClient.post('/admin/quests', payload)
}

export function updateQuest(id: number, payload: QuestPayload): Promise<Quest> {
  return apiClient.put(`/admin/quests/${id}`, payload)
}

export function deleteQuest(id: number): Promise<void> {
  return apiClient.delete(`/admin/quests/${id}`)
}

// ── World Item Spawns ─────────────────────────────────────────────────────────

export function listWorldItemSpawns(): Promise<WorldItemSpawn[]> {
  return apiClient.get('/admin/world-item-spawns')
}

export interface WorldItemSpawnPayload {
  item_id: number
  quantity: number
  location: { latitude: number; longitude: number }
  is_hidden: boolean
  expires_at: string | null
}

export function placeWorldItem(payload: WorldItemSpawnPayload): Promise<WorldItemSpawn> {
  return apiClient.post('/admin/world-item-spawns', payload)
}

export function deactivateWorldItem(id: number): Promise<void> {
  return apiClient.delete(`/admin/world-item-spawns/${id}`)
}

// ── Item Spawn Areas ──────────────────────────────────────────────────────────

export function listItemSpawnAreas(): Promise<ItemSpawnArea[]> {
  return apiClient.get('/admin/item-spawn-areas')
}

export interface ItemSpawnAreaEntryPayload {
  item_id: number
  spawn_chance: number
  max_quantity: number
}

export interface ItemSpawnAreaPayload {
  name: string
  center: { latitude: number; longitude: number }
  radius_meters: number
  items: ItemSpawnAreaEntryPayload[]
}

export function createItemSpawnArea(payload: ItemSpawnAreaPayload): Promise<ItemSpawnArea> {
  return apiClient.post('/admin/item-spawn-areas', payload)
}

export function setItemSpawnAreaItems(
  id: number,
  items: ItemSpawnAreaEntryPayload[],
): Promise<ItemSpawnArea> {
  return apiClient.put(`/admin/item-spawn-areas/${id}/items`, { items })
}

export function deleteItemSpawnArea(id: number): Promise<void> {
  return apiClient.delete(`/admin/item-spawn-areas/${id}`)
}

// ── Admins ────────────────────────────────────────────────────────────────────

export function createAdmin(username: string, password: string): Promise<{ id: number }> {
  return apiClient.post('/admin/admins', { username, password })
}
