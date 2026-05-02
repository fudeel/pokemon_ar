// admin-frontend/app/dashboard/map/page.tsx
'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { MapToolbar } from '@/components/map/MapToolbar'
import { PlacementModal } from '@/components/map/PlacementModal'
import { EditSpawnAreaModal } from '@/components/map/EditSpawnAreaModal'
import {
  deleteEventArea,
  deleteGym,
  deleteMapObject,
  deleteNpc,
  deleteRarePokemon,
  deleteSpawnArea,
  listEventAreas,
  listGyms,
  listMapObjects,
  listNpcs,
  listRarePokemon,
  listSpawnAreas,
  listSpecies,
} from '@/lib/api/admin'
import type {
  EntityType,
  EventArea,
  Gym,
  MapObject,
  Npc,
  PokemonSpecies,
  RareWildPokemon,
  SpawnArea,
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
  const [species, setSpecies] = useState<PokemonSpecies[]>([])

  const [activeType, setActiveType] = useState<EntityType | null>(null)
  const [placement, setPlacement] = useState<PlacementTarget | null>(null)
  const [editingSpawnArea, setEditingSpawnArea] = useState<SpawnArea | null>(null)

  const loadAll = useCallback(async () => {
    const [mos, npcList, sas, eas, gymList, rares, sp] = await Promise.all([
      listMapObjects(),
      listNpcs(),
      listSpawnAreas(),
      listEventAreas(),
      listGyms(),
      listRarePokemon(),
      listSpecies(),
    ])
    setMapObjects(mos)
    setNpcs(npcList)
    setSpawnAreas(sas)
    setEventAreas(eas)
    setGyms(gymList)
    setRarePokemon(rares)
    setSpecies(sp)
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
      }
      setActiveType(null)
    },
    [],
  )

  const handleSpawnAreaUpdated = useCallback((updated: SpawnArea) => {
    setSpawnAreas((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
    setEditingSpawnArea(null)
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

  const totalEntities =
    mapObjects.length + npcs.length + spawnAreas.length +
    eventAreas.length + gyms.length + rarePokemon.length

  return (
    <div className="flex flex-col h-full">
      <Header
        title="World Map"
        subtitle={`${totalEntities} entities on the map`}
      />
      <MapToolbar activeType={activeType} onSelect={setActiveType} />
      <div className="flex-1 flex overflow-hidden">
        <GameMap
          data={{ mapObjects, npcs, spawnAreas, eventAreas, gyms, rarePokemon }}
          activeType={activeType}
          onMapClick={handleMapClick}
          onDeleteMapObject={handleDeleteMapObject}
          onDeleteNpc={handleDeleteNpc}
          onEditSpawnArea={setEditingSpawnArea}
          onDeleteSpawnArea={handleDeleteSpawnArea}
          onDeleteEventArea={handleDeleteEventArea}
          onDeleteGym={handleDeleteGym}
          onDeleteRarePokemon={handleDeleteRarePokemon}
        />
      </div>

      {placement && (
        <PlacementModal
          type={placement.type}
          coords={{ latitude: placement.latitude, longitude: placement.longitude }}
          species={species}
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
    </div>
  )
}
