// admin-frontend/app/dashboard/map/page.tsx
'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { MapToolbar } from '@/components/map/MapToolbar'
import { PlacementModal } from '@/components/map/PlacementModal'
import { EditSpawnAreaModal } from '@/components/map/EditSpawnAreaModal'
import { EditItemSpawnAreaModal } from '@/components/map/EditItemSpawnAreaModal'
import { POLYGON_AREA_TYPES } from '@/components/map/GameMap'
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

const GameMap = dynamic(
  () => import('@/components/map/GameMap').then((m) => m.GameMap),
  { ssr: false, loading: () => <div className="flex-1 flex items-center justify-center text-gray-400">Loading map…</div> },
)

interface PointPlacement {
  kind: 'point'
  type: EntityType
  latitude: number
  longitude: number
}

interface PolygonPlacement {
  kind: 'polygon'
  type: EntityType
  polygon: GeoLocation[]
}

type Placement = PointPlacement | PolygonPlacement

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
  const [drawingPolygon, setDrawingPolygon] = useState<GeoLocation[]>([])
  const [placement, setPlacement] = useState<Placement | null>(null)
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

  const handleSelectType = useCallback((type: EntityType | null) => {
    setActiveType(type)
    setDrawingPolygon([])
  }, [])

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (!activeType) return
      setPlacement({ kind: 'point', type: activeType, latitude: lat, longitude: lng })
    },
    [activeType],
  )

  const handleAddPolygonPoint = useCallback((lat: number, lng: number) => {
    setDrawingPolygon((prev) => [...prev, { latitude: lat, longitude: lng }])
  }, [])

  const handleClearDrawing = useCallback(() => {
    setDrawingPolygon([])
  }, [])

  const handleClosePolygon = useCallback(() => {
    if (!activeType || drawingPolygon.length < 3) return
    setPlacement({ kind: 'polygon', type: activeType, polygon: drawingPolygon })
  }, [activeType, drawingPolygon])

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
      setDrawingPolygon([])
    },
    [],
  )

  const handlePlacementClose = useCallback(() => {
    setPlacement(null)
  }, [])

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

  const isDrawingMode = activeType !== null && POLYGON_AREA_TYPES.has(activeType)

  return (
    <div className="flex flex-col h-full">
      <Header
        title="World Map"
        subtitle={`${totalEntities} entities on the map`}
      />
      <MapToolbar activeType={activeType} onSelect={handleSelectType} />
      <div className="flex-1 flex overflow-hidden relative">
        <GameMap
          data={{ mapObjects, npcs, spawnAreas, eventAreas, gyms, rarePokemon, worldItemSpawns, itemSpawnAreas }}
          activeType={activeType}
          drawingPolygon={drawingPolygon}
          onMapClick={handleMapClick}
          onAddPolygonPoint={handleAddPolygonPoint}
          onClosePolygon={handleClosePolygon}
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

        {isDrawingMode && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-2/95 backdrop-blur border border-surface-3 shadow-lg text-xs">
            <span className="text-gray-300">
              Drawing zone — <span className="text-amber-400 font-medium">{drawingPolygon.length}</span> point{drawingPolygon.length === 1 ? '' : 's'}
            </span>
            <button
              type="button"
              onClick={handleClosePolygon}
              disabled={drawingPolygon.length < 3}
              className="px-2.5 py-1 rounded bg-emerald-600 text-white font-medium hover:bg-emerald-500 disabled:bg-surface-3 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              Close shape
            </button>
            <button
              type="button"
              onClick={handleClearDrawing}
              disabled={drawingPolygon.length === 0}
              className="px-2.5 py-1 rounded bg-surface-3 text-gray-200 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
              title="Clear drawing"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>
            <span className="text-gray-500 ml-1">Click the green start marker to close</span>
          </div>
        )}
      </div>

      {placement && placement.kind === 'point' && (
        <PlacementModal
          type={placement.type}
          coords={{ latitude: placement.latitude, longitude: placement.longitude }}
          species={species}
          items={items}
          onCreated={handleEntityCreated}
          onClose={handlePlacementClose}
        />
      )}

      {placement && placement.kind === 'polygon' && (
        <PlacementModal
          type={placement.type}
          polygon={placement.polygon}
          species={species}
          items={items}
          onCreated={handleEntityCreated}
          onClose={handlePlacementClose}
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
