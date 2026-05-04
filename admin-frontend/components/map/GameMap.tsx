// admin-frontend/components/map/GameMap.tsx
'use client'

import { useEffect } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  Polyline,
  useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Button } from '@/components/ui/Button'
import { formatDateTime } from '@/lib/utils'
import type {
  EntityType,
  EventArea,
  GeoLocation,
  Gym,
  ItemSpawnArea,
  MapObject,
  Npc,
  RareWildPokemon,
  SpawnArea,
  WorldItemSpawn,
} from '@/types'

export const POLYGON_AREA_TYPES: ReadonlySet<EntityType> = new Set([
  'spawn_area',
  'event_area',
  'item_spawn_area',
])

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

function makeHiddenItemIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:18px;height:18px;border-radius:4px;background:#7c3aed;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;font-size:10px;color:white;font-weight:bold">?</div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

function makeVertexIcon(label: string, isFirst: boolean, canClose: boolean) {
  const bg = isFirst ? (canClose ? '#22c55e' : '#3b82f6') : '#3b82f6'
  const ring = isFirst && canClose ? 'box-shadow:0 0 0 3px rgba(34,197,94,0.35), 0 1px 4px rgba(0,0,0,0.6);' : 'box-shadow:0 1px 4px rgba(0,0,0,0.6);'
  return L.divIcon({
    className: '',
    html: `<div style="width:18px;height:18px;border-radius:50%;background:${bg};border:2px solid white;${ring}display:flex;align-items:center;justify-content:center;font-size:10px;color:white;font-weight:bold">${label}</div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

const ICONS: Record<EntityType, L.DivIcon> = {
  map_object: makeColoredIcon('#6b7280'),
  npc: makeColoredIcon('#8b5cf6'),
  spawn_area: makeColoredIcon('#10b981'),
  event_area: makeColoredIcon('#f59e0b'),
  gym: makeColoredIcon('#ef4444'),
  rare_pokemon: makeColoredIcon('#ec4899'),
  world_item: makeColoredIcon('#f97316'),
  item_spawn_area: makeColoredIcon('#fb923c'),
}

interface ClickHandlerProps {
  activeType: EntityType | null
  isDrawingPolygon: boolean
  onMapClick: (lat: number, lng: number) => void
  onAddPolygonPoint: (lat: number, lng: number) => void
}

function ClickHandler({ activeType, isDrawingPolygon, onMapClick, onAddPolygonPoint }: ClickHandlerProps) {
  useMapEvents({
    click(e) {
      if (!activeType) return
      if (isDrawingPolygon) {
        onAddPolygonPoint(e.latlng.lat, e.latlng.lng)
      } else {
        onMapClick(e.latlng.lat, e.latlng.lng)
      }
    },
  })
  return null
}

function polygonLatLngs(polygon: GeoLocation[]): [number, number][] {
  return polygon.map((p) => [p.latitude, p.longitude])
}

export interface GameMapData {
  mapObjects: MapObject[]
  npcs: Npc[]
  spawnAreas: SpawnArea[]
  eventAreas: EventArea[]
  gyms: Gym[]
  rarePokemon: RareWildPokemon[]
  worldItemSpawns: WorldItemSpawn[]
  itemSpawnAreas: ItemSpawnArea[]
}

interface GameMapProps {
  data: GameMapData
  activeType: EntityType | null
  drawingPolygon: GeoLocation[]
  onMapClick: (lat: number, lng: number) => void
  onAddPolygonPoint: (lat: number, lng: number) => void
  onClosePolygon: () => void
  onDeleteMapObject: (id: number) => void
  onDeleteNpc: (id: number) => void
  onEditSpawnArea: (area: SpawnArea) => void
  onDeleteSpawnArea: (id: number) => void
  onDeleteEventArea: (id: number) => void
  onDeleteGym: (id: number) => void
  onDeleteRarePokemon: (id: number) => void
  onDeactivateWorldItem: (id: number) => void
  onEditItemSpawnArea: (area: ItemSpawnArea) => void
  onDeleteItemSpawnArea: (id: number) => void
}

export function GameMap({
  data,
  activeType,
  drawingPolygon,
  onMapClick,
  onAddPolygonPoint,
  onClosePolygon,
  onDeleteMapObject,
  onDeleteNpc,
  onEditSpawnArea,
  onDeleteSpawnArea,
  onDeleteEventArea,
  onDeleteGym,
  onDeleteRarePokemon,
  onDeactivateWorldItem,
  onEditItemSpawnArea,
  onDeleteItemSpawnArea,
}: GameMapProps) {
  useEffect(() => {
    fixLeafletIcons()
  }, [])

  const isDrawingMode = activeType !== null && POLYGON_AREA_TYPES.has(activeType)
  const canClose = drawingPolygon.length >= 3

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

      <ClickHandler
        activeType={activeType}
        isDrawingPolygon={isDrawingMode}
        onMapClick={onMapClick}
        onAddPolygonPoint={onAddPolygonPoint}
      />

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
        <Polygon
          key={`sa-${area.id}`}
          positions={polygonLatLngs(area.polygon)}
          pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.15, weight: 1.5 }}
        >
          <Popup>
            <div className="text-xs space-y-2" style={{ minWidth: 160 }}>
              <p className="font-semibold">{area.name}</p>
              <p className="text-gray-500">{area.polygon.length}-point zone</p>
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
        </Polygon>
      ))}

      {data.eventAreas.map((area) => (
        <Polygon
          key={`ea-${area.id}`}
          positions={polygonLatLngs(area.polygon)}
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
        </Polygon>
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

      {data.worldItemSpawns.map((spawn) => (
        <Marker
          key={`wi-${spawn.id}`}
          position={[spawn.location.latitude, spawn.location.longitude]}
          icon={spawn.is_hidden ? makeHiddenItemIcon() : ICONS.world_item}
        >
          <Popup>
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold">{spawn.item_name}</p>
                {spawn.is_hidden ? (
                  <span style={{ background: '#7c3aed' }} className="px-1.5 py-0.5 rounded text-white text-xs font-medium">
                    Mystery
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-orange-500 text-white text-xs font-medium">
                    Visible
                  </span>
                )}
              </div>
              <p className="text-gray-500 capitalize">{spawn.item_category} · qty {spawn.quantity}</p>
              {spawn.expires_at && <p className="text-gray-500">Expires: {formatDateTime(spawn.expires_at)}</p>}
              <Button size="sm" variant="danger" onClick={() => onDeactivateWorldItem(spawn.id)}>
                Deactivate
              </Button>
            </div>
          </Popup>
        </Marker>
      ))}

      {data.itemSpawnAreas.map((area) => (
        <Polygon
          key={`isa-${area.id}`}
          positions={polygonLatLngs(area.polygon)}
          pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.12, weight: 1.5, dashArray: '4 3' }}
        >
          <Popup>
            <div className="text-xs space-y-2" style={{ minWidth: 160 }}>
              <p className="font-semibold">{area.name}</p>
              <p className="text-gray-500">{area.polygon.length}-point zone</p>
              {area.items.length === 0 ? (
                <p className="text-gray-400 italic">No items configured</p>
              ) : (
                <ul className="space-y-0.5">
                  {area.items.map((item) => (
                    <li key={item.item_id} className="flex justify-between gap-3">
                      <span>{item.item_name}</span>
                      <span className="text-gray-400">{item.spawn_chance}% ×{item.max_quantity}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-1 pt-1">
                <Button size="sm" variant="secondary" onClick={() => onEditItemSpawnArea(area)}>
                  Edit
                </Button>
                <Button size="sm" variant="danger" onClick={() => onDeleteItemSpawnArea(area.id)}>
                  Delete
                </Button>
              </div>
            </div>
          </Popup>
        </Polygon>
      ))}

      {isDrawingMode && drawingPolygon.length >= 2 && (
        <Polyline
          positions={polygonLatLngs(drawingPolygon)}
          pathOptions={{ color: '#fbbf24', weight: 2, dashArray: '4 4' }}
        />
      )}
      {isDrawingMode && drawingPolygon.length >= 3 && (
        <Polyline
          positions={[
            [drawingPolygon[drawingPolygon.length - 1].latitude, drawingPolygon[drawingPolygon.length - 1].longitude],
            [drawingPolygon[0].latitude, drawingPolygon[0].longitude],
          ]}
          pathOptions={{ color: '#fbbf24', weight: 1, dashArray: '2 6', opacity: 0.5 }}
        />
      )}

      {isDrawingMode &&
        drawingPolygon.map((point, i) => {
          const isFirst = i === 0
          const handleClick = isFirst && canClose ? () => onClosePolygon() : undefined
          return (
            <Marker
              key={`vertex-${i}`}
              position={[point.latitude, point.longitude]}
              icon={makeVertexIcon(String(i + 1), isFirst, canClose)}
              eventHandlers={handleClick ? { click: handleClick } : undefined}
            />
          )
        })}
    </MapContainer>
  )
}
