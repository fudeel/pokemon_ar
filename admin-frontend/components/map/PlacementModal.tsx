// admin-frontend/components/map/PlacementModal.tsx
'use client'

import { Modal } from '@/components/ui/Modal'
import { MapObjectForm } from './forms/MapObjectForm'
import { NpcForm } from './forms/NpcForm'
import { SpawnAreaForm } from './forms/SpawnAreaForm'
import { EventAreaForm } from './forms/EventAreaForm'
import { GymForm } from './forms/GymForm'
import { RarePokemonForm } from './forms/RarePokemonForm'
import { WorldItemForm } from './forms/WorldItemForm'
import { ItemSpawnAreaForm } from './forms/ItemSpawnAreaForm'
import type {
  EntityType,
  EventArea,
  GeoLocation,
  Gym,
  Item,
  ItemSpawnArea,
  MapObject,
  Npc,
  PokemonSpecies,
  RareWildPokemon,
  SpawnArea,
  WorldItemSpawn,
} from '@/types'

interface PlacementCoords {
  latitude: number
  longitude: number
}

interface PlacementModalProps {
  type: EntityType
  /** For point-style placements (NPC, gym, etc). */
  coords?: PlacementCoords
  /** For polygon area placements (spawn_area, event_area, item_spawn_area). */
  polygon?: GeoLocation[]
  species: PokemonSpecies[]
  items: Item[]
  onCreated: (type: EntityType, entity: unknown) => void
  onClose: () => void
}

const TITLES: Record<EntityType, string> = {
  map_object: 'Place Map Object',
  npc: 'Place NPC',
  spawn_area: 'Create Spawn Area',
  event_area: 'Create Event Area',
  gym: 'Place Gym',
  rare_pokemon: 'Spawn Rare Pokémon',
  world_item: 'Place World Item',
  item_spawn_area: 'Create Item Spawn Zone',
}

const MODAL_WIDTHS: Partial<Record<EntityType, 'sm' | 'md' | 'lg'>> = {
  spawn_area: 'md',
  item_spawn_area: 'md',
}

export function PlacementModal({ type, coords, polygon, species, items, onCreated, onClose }: PlacementModalProps) {
  const handleCreated = (entity: unknown) => {
    onCreated(type, entity)
    onClose()
  }

  // For point placements, derive lat/lng. Falls back to a no-op so TS is happy
  // for the types where coords aren't expected.
  const latitude = coords?.latitude ?? 0
  const longitude = coords?.longitude ?? 0

  return (
    <Modal title={TITLES[type]} onClose={onClose} width={MODAL_WIDTHS[type] ?? 'sm'}>
      {type === 'map_object' && coords && (
        <MapObjectForm
          latitude={latitude}
          longitude={longitude}
          onCreated={(obj: MapObject) => handleCreated(obj)}
          onCancel={onClose}
        />
      )}
      {type === 'npc' && coords && (
        <NpcForm
          latitude={latitude}
          longitude={longitude}
          onCreated={(npc: Npc) => handleCreated(npc)}
          onCancel={onClose}
        />
      )}
      {type === 'spawn_area' && polygon && (
        <SpawnAreaForm
          polygon={polygon}
          species={species}
          onSaved={(area: SpawnArea) => handleCreated(area)}
          onCancel={onClose}
        />
      )}
      {type === 'event_area' && polygon && (
        <EventAreaForm
          polygon={polygon}
          onCreated={(area: EventArea) => handleCreated(area)}
          onCancel={onClose}
        />
      )}
      {type === 'gym' && coords && (
        <GymForm
          latitude={latitude}
          longitude={longitude}
          onCreated={(gym: Gym) => handleCreated(gym)}
          onCancel={onClose}
        />
      )}
      {type === 'rare_pokemon' && coords && (
        <RarePokemonForm
          latitude={latitude}
          longitude={longitude}
          species={species}
          onCreated={(p: RareWildPokemon) => handleCreated(p)}
          onCancel={onClose}
        />
      )}
      {type === 'world_item' && coords && (
        <WorldItemForm
          latitude={latitude}
          longitude={longitude}
          items={items}
          onCreated={(spawn: WorldItemSpawn) => handleCreated(spawn)}
          onCancel={onClose}
        />
      )}
      {type === 'item_spawn_area' && polygon && (
        <ItemSpawnAreaForm
          polygon={polygon}
          items={items}
          onSaved={(area: ItemSpawnArea) => handleCreated(area)}
          onCancel={onClose}
        />
      )}
    </Modal>
  )
}
