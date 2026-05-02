// admin-frontend/components/map/GameMap.tsx
'use client'

import { useEffect } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Button } from '@/components/ui/Button'
import { formatDateTime } from '@/lib/utils'
import type {
  EntityType,
  EventArea,
  Gym,
  MapObject,
  Npc,
  RareWildPokemon,
  SpawnArea,
} from '@/types'

// Fix Leaflet default icon paths broken by webpack
function fixLeafletIcons() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  })
}

function makeColoredIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.5)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

const ICONS: Record<EntityType, L.DivIcon> = {
  map_object: makeColoredIcon('#6b7280'),
  npc: makeColoredIcon('#8b5cf6'),
  spawn_area: makeColoredIcon('#10b981'),
  event_area: makeColoredIcon('#f59e0b'),
  gym: makeColoredIcon('#ef4444'),
  rare_pokemon: makeColoredIcon('#ec4899'),
}

interface ClickHandlerProps {
  activeType: EntityType | null
  onMapClick: (lat: number, lng: number) => void
}

function ClickHandler({ activeType, onMapClick }: ClickHandlerProps) {
  useMapEvents({
    click(e) {
      if (activeType) {
        onMapClick(e.latlng.lat, e.latlng.lng)
      }
    },
  })
  return null
}

export interface GameMapData {
  mapObjects: MapObject[]
  npcs: Npc[]
  spawnAreas: SpawnArea[]
  eventAreas: EventArea[]
  gyms: Gym[]
  rarePokemon: RareWildPokemon[]
}

interface GameMapProps {
  data: GameMapData
  activeType: EntityType | null
  onMapClick: (lat: number, lng: number) => void
  onDeleteMapObject: (id: number) => void
  onDeleteNpc: (id: number) => void
  onEditSpawnArea: (area: SpawnArea) => void
  onDeleteSpawnArea: (id: number) => void
  onDeleteEventArea: (id: number) => void
  onDeleteGym: (id: number) => void
  onDeleteRarePokemon: (id: number) => void
}

export function GameMap({
  data,
  activeType,
  onMapClick,
  onDeleteMapObject,
  onDeleteNpc,
  onEditSpawnArea,
  onDeleteSpawnArea,
  onDeleteEventArea,
  onDeleteGym,
  onDeleteRarePokemon,
}: GameMapProps) {
  useEffect(() => {
    fixLeafletIcons()
  }, [])

  return (
    <MapContainer
      center={[41.9028, 12.4964]}
      zoom={13}
      style={{ flex: 1, cursor: activeType ? 'crosshair' : 'grab' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com">CartoDB</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      <ClickHandler activeType={activeType} onMapClick={onMapClick} />

      {data.mapObjects.map((obj) => (
        <Marker
          key={`mo-${obj.id}`}
          position={[obj.location.latitude, obj.location.longitude]}
          icon={ICONS.map_object}
        >
          <Popup>
            <div className="text-xs space-y-1">
              <p className="font-semibold">{obj.name ?? obj.kind}</p>
              <p className="text-gray-500 capitalize">{obj.kind.replace('_', ' ')}</p>
              <Button size="sm" variant="danger" onClick={() => onDeleteMapObject(obj.id)}>
                Delete
              </Button>
            </div>
          </Popup>
        </Marker>
      ))}

      {data.npcs.map((npc) => (
        <Marker
          key={`npc-${npc.id}`}
          position={[npc.location.latitude, npc.location.longitude]}
          icon={ICONS.npc}
        >
          <Popup>
            <div className="text-xs space-y-1">
              <p className="font-semibold">{npc.name}</p>
              <p className="text-gray-500 capitalize">{npc.role}</p>
              {npc.dialogue && <p className="italic text-gray-400">"{npc.dialogue}"</p>}
              <Button size="sm" variant="danger" onClick={() => onDeleteNpc(npc.id)}>
                Delete
              </Button>
            </div>
          </Popup>
        </Marker>
      ))}

      {data.spawnAreas.map((area) => (
        <Circle
          key={`sa-${area.id}`}
          center={[area.center.latitude, area.center.longitude]}
          radius={area.radius_meters}
          pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.15, weight: 1.5 }}
        >
          <Popup>
            <div className="text-xs space-y-2" style={{ minWidth: 160 }}>
              <p className="font-semibold">{area.name}</p>
              <p className="text-gray-500">{area.radius_meters}m radius</p>
              {area.pokemon.length === 0 ? (
                <p className="text-gray-400 italic">No Pokémon configured</p>
              ) : (
                <ul className="space-y-0.5">
                  {area.pokemon.map((p) => (
                    <li key={p.species_id} className="flex justify-between gap-3">
                      <span>{p.species_name}</span>
                      <span className="text-gray-400">{p.spawn_chance}%</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-1 pt-1">
                <Button size="sm" variant="secondary" onClick={() => onEditSpawnArea(area)}>
                  Edit
                </Button>
                <Button size="sm" variant="danger" onClick={() => onDeleteSpawnArea(area.id)}>
                  Delete
                </Button>
              </div>
            </div>
          </Popup>
        </Circle>
      ))}

      {data.eventAreas.map((area) => (
        <Circle
          key={`ea-${area.id}`}
          center={[area.center.latitude, area.center.longitude]}
          radius={area.radius_meters}
          pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.12, weight: 1.5, dashArray: '6 4' }}
        >
          <Popup>
            <div className="text-xs space-y-1">
              <p className="font-semibold">{area.name}</p>
              {area.description && <p className="text-gray-400">{area.description}</p>}
              <p className="text-gray-500">{formatDateTime(area.starts_at)} → {formatDateTime(area.ends_at)}</p>
              <Button size="sm" variant="danger" onClick={() => onDeleteEventArea(area.id)}>
                Delete
              </Button>
            </div>
          </Popup>
        </Circle>
      ))}

      {data.gyms.map((gym) => (
        <Marker
          key={`gym-${gym.id}`}
          position={[gym.location.latitude, gym.location.longitude]}
          icon={ICONS.gym}
        >
          <Popup>
            <div className="text-xs space-y-1">
              <p className="font-semibold">{gym.name}</p>
              <p className="text-gray-500">
                {gym.current_leader_player_id
                  ? `Leader: Player #${gym.current_leader_player_id}`
                  : 'No current leader'}
              </p>
              <p className="text-gray-500">{gym.defenders.length} defenders</p>
              <Button size="sm" variant="danger" onClick={() => onDeleteGym(gym.id)}>
                Delete
              </Button>
            </div>
          </Popup>
        </Marker>
      ))}

      {data.rarePokemon.map((p) => (
        <Marker
          key={`rp-${p.id}`}
          position={[p.location.latitude, p.location.longitude]}
          icon={ICONS.rare_pokemon}
        >
          <Popup>
            <div className="text-xs space-y-1">
              <p className="font-semibold">{p.species_name} <span className="text-gray-400">Lv.{p.level}</span></p>
              {p.expires_at && <p className="text-gray-500">Expires: {formatDateTime(p.expires_at)}</p>}
              <Button size="sm" variant="danger" onClick={() => onDeleteRarePokemon(p.id)}>
                Remove
              </Button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
