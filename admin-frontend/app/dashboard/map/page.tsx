// admin-frontend/app/dashboard/map/page.tsx
'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { MapToolbar } from '@/components/map/MapToolbar'
import { PlacementModal } from '@/components/map/PlacementModal'
import { EditSpawnAreaModal } from '@/components/map/EditSpawnAreaModal'
import { EditItemSpawnAreaModal } from '@/components/map/EditItemSpawnAreaModal'
import {
  deactivateWorldItem,
  deleteEventArea,
  deleteGym,
  deleteItemSpawnArea,
  deleteMapObject,
  deleteNpc,
  deleteRarePokemon,
  deleteSpawnArea,
  listEventAreas,
  listGyms,
  listItemSpawnAreas,
  listItems,
  listMapObjects,
  listNpcs,
  listRarePokemon,
  listSpawnAreas,
  listSpecies,
  listWorldItemSpawns,
} from '@/lib/api/admin'
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

const GameMap = dynamic(
  () => import('@/components/map/GameMap').then((m) => m.GameMap),
  { ssr: false, loading: () => <div className="flex-1 flex items-center justify-center text-gray-400">Loading map…</div> },
)

interface PlacementTarget {
  type: EntityType
  latitude: number
  longitude: number
}

export default function MapPage() {
  const [mapObjects, setMapObjects] = useState<MapObject[]>([])
  const [npcs, setNpcs] = useState<Npc[]>([])
  const [spawnAreas, setSpawnAreas] = useState<SpawnArea[]>([])
  const [eventAreas, setEventAreas] = useState<EventArea[]>([])
  const [gyms, setGyms] = useState<Gym[]>([])
  const [rarePokemon, setRarePokemon] = useState<RareWildPokemon[]>([])
  const [worldItemSpawns, setWorldItemSpawns] = useState<WorldItemSpawn[]>([])
  const [itemSpawnAreas, setItemSpawnAreas] = useState<ItemSpawnArea[]>([])
  const [species, setSpecies] = useState<PokemonSpecies[]>([])
  const [items, setItems] = useState<Item[]>([])

  const [activeType, setActiveType] = useState<EntityType | null>(null)
  const [placement, setPlacement] = useState<PlacementTarget | null>(null)
  const [editingSpawnArea, setEditingSpawnArea] = useState<SpawnArea | null>(null)
  const [editingItemSpawnArea, setEditingItemSpawnArea] = useState<ItemSpawnArea | null>(null)

  const loadAll = useCallback(async () => {
    const [mos, npcList, sas, eas, gymList, rares, wisps, isas, sp, itemList] = await Promise.all([
      listMapObjects(),
      listNpcs(),
      listSpawnAreas(),
      listEventAreas(),
      listGyms(),
      listRarePokemon(),
      listWorldItemSpawns(),
      listItemSpawnAreas(),
      listSpecies(),
      listItems(),
    ])
    setMapObjects(mos)
    setNpcs(npcList)
    setSpawnAreas(sas)
    setEventAreas(eas)
    setGyms(gymList)
    setRarePokemon(rares)
    setWorldItemSpawns(wisps)
    setItemSpawnAreas(isas)
    setSpecies(sp)
    setItems(itemList)
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (!activeType) return
      setPlacement({ type: activeType, latitude: lat, longitude: lng })
    },
    [activeType],
  )

  const handleEntityCreated = useCallback(
    (type: EntityType, entity: unknown) => {
      switch (type) {
        case 'map_object': setMapObjects((p) => [...p, entity as MapObject]); break
        case 'npc': setNpcs((p) => [...p, entity as Npc]); break
        case 'spawn_area': setSpawnAreas((p) => [...p, entity as SpawnArea]); break
        case 'event_area': setEventAreas((p) => [...p, entity as EventArea]); break
        case 'gym': setGyms((p) => [...p, entity as Gym]); break
        case 'rare_pokemon': setRarePokemon((p) => [...p, entity as RareWildPokemon]); break
        case 'world_item': setWorldItemSpawns((p) => [...p, entity as WorldItemSpawn]); break
        case 'item_spawn_area': setItemSpawnAreas((p) => [...p, entity as ItemSpawnArea]); break
      }
      setActiveType(null)
    },
    [],
  )

  const handleSpawnAreaUpdated = useCallback((updated: SpawnArea) => {
    setSpawnAreas((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
    setEditingSpawnArea(null)
  }, [])

  const handleItemSpawnAreaUpdated = useCallback((updated: ItemSpawnArea) => {
    setItemSpawnAreas((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
    setEditingItemSpawnArea(null)
  }, [])

  const handleDeleteMapObject = useCallback(async (id: number) => {
    await deleteMapObject(id)
    setMapObjects((p) => p.filter((o) => o.id !== id))
  }, [])

  const handleDeleteNpc = useCallback(async (id: number) => {
    await deleteNpc(id)
    setNpcs((p) => p.filter((o) => o.id !== id))
  }, [])

  const handleDeleteSpawnArea = useCallback(async (id: number) => {
    await deleteSpawnArea(id)
    setSpawnAreas((p) => p.filter((o) => o.id !== id))
  }, [])

  const handleDeleteEventArea = useCallback(async (id: number) => {
    await deleteEventArea(id)
    setEventAreas((p) => p.filter((o) => o.id !== id))
  }, [])

  const handleDeleteGym = useCallback(async (id: number) => {
    await deleteGym(id)
    setGyms((p) => p.filter((o) => o.id !== id))
  }, [])

  const handleDeleteRarePokemon = useCallback(async (id: number) => {
    await deleteRarePokemon(id)
    setRarePokemon((p) => p.filter((o) => o.id !== id))
  }, [])

  const handleDeactivateWorldItem = useCallback(async (id: number) => {
    await deactivateWorldItem(id)
    setWorldItemSpawns((p) => p.filter((o) => o.id !== id))
  }, [])

  const handleDeleteItemSpawnArea = useCallback(async (id: number) => {
    await deleteItemSpawnArea(id)
    setItemSpawnAreas((p) => p.filter((o) => o.id !== id))
  }, [])

  const totalEntities =
    mapObjects.length + npcs.length + spawnAreas.length +
    eventAreas.length + gyms.length + rarePokemon.length +
    worldItemSpawns.length + itemSpawnAreas.length

  return (
    <div className="flex flex-col h-full">
      <Header
        title="World Map"
        subtitle={`${totalEntities} entities on the map`}
      />
      <MapToolbar activeType={activeType} onSelect={setActiveType} />
      <div className="flex-1 flex overflow-hidden">
        <GameMap
          data={{ mapObjects, npcs, spawnAreas, eventAreas, gyms, rarePokemon, worldItemSpawns, itemSpawnAreas }}
          activeType={activeType}
          onMapClick={handleMapClick}
          onDeleteMapObject={handleDeleteMapObject}
          onDeleteNpc={handleDeleteNpc}
          onEditSpawnArea={setEditingSpawnArea}
          onDeleteSpawnArea={handleDeleteSpawnArea}
          onDeleteEventArea={handleDeleteEventArea}
          onDeleteGym={handleDeleteGym}
          onDeleteRarePokemon={handleDeleteRarePokemon}
          onDeactivateWorldItem={handleDeactivateWorldItem}
          onEditItemSpawnArea={setEditingItemSpawnArea}
          onDeleteItemSpawnArea={handleDeleteItemSpawnArea}
        />
      </div>

      {placement && (
        <PlacementModal
          type={placement.type}
          coords={{ latitude: placement.latitude, longitude: placement.longitude }}
          species={species}
          items={items}
          onCreated={handleEntityCreated}
          onClose={() => setPlacement(null)}
        />
      )}

      {editingSpawnArea && (
        <EditSpawnAreaModal
          area={editingSpawnArea}
          species={species}
          onSaved={handleSpawnAreaUpdated}
          onClose={() => setEditingSpawnArea(null)}
        />
      )}

      {editingItemSpawnArea && (
        <EditItemSpawnAreaModal
          area={editingItemSpawnArea}
          items={items}
          onSaved={handleItemSpawnAreaUpdated}
          onClose={() => setEditingItemSpawnArea(null)}
        />
      )}
    </div>
  )
}
