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
  coords: PlacementCoords
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

export function PlacementModal({ type, coords, species, items, onCreated, onClose }: PlacementModalProps) {
  const { latitude, longitude } = coords

  const handleCreated = (entity: unknown) => {
    onCreated(type, entity)
    onClose()
  }

  return (
    <Modal title={TITLES[type]} onClose={onClose} width={MODAL_WIDTHS[type] ?? 'sm'}>
      {type === 'map_object' && (
        <MapObjectForm
          latitude={latitude}
          longitude={longitude}
          onCreated={(obj: MapObject) => handleCreated(obj)}
          onCancel={onClose}
        />
      )}
      {type === 'npc' && (
        <NpcForm
          latitude={latitude}
          longitude={longitude}
          onCreated={(npc: Npc) => handleCreated(npc)}
          onCancel={onClose}
        />
      )}
      {type === 'spawn_area' && (
        <SpawnAreaForm
          latitude={latitude}
          longitude={longitude}
          species={species}
          onSaved={(area: SpawnArea) => handleCreated(area)}
          onCancel={onClose}
        />
      )}
      {type === 'event_area' && (
        <EventAreaForm
          latitude={latitude}
          longitude={longitude}
          onCreated={(area: EventArea) => handleCreated(area)}
          onCancel={onClose}
        />
      )}
      {type === 'gym' && (
        <GymForm
          latitude={latitude}
          longitude={longitude}
          onCreated={(gym: Gym) => handleCreated(gym)}
          onCancel={onClose}
        />
      )}
      {type === 'rare_pokemon' && (
        <RarePokemonForm
          latitude={latitude}
          longitude={longitude}
          species={species}
          onCreated={(p: RareWildPokemon) => handleCreated(p)}
          onCancel={onClose}
        />
      )}
      {type === 'world_item' && (
        <WorldItemForm
          latitude={latitude}
          longitude={longitude}
          items={items}
          onCreated={(spawn: WorldItemSpawn) => handleCreated(spawn)}
          onCancel={onClose}
        />
      )}
      {type === 'item_spawn_area' && (
        <ItemSpawnAreaForm
          latitude={latitude}
          longitude={longitude}
          items={items}
          onSaved={(area: ItemSpawnArea) => handleCreated(area)}
          onCancel={onClose}
        />
      )}
    </Modal>
  )
}
