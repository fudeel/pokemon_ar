// game-development-frontend/components/game/GameMap.tsx

'use client'

import { useEffect, useLayoutEffect } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

import PlayerMarker from './PlayerMarker'
import SpawnedPokemonMarker from './SpawnedPokemonMarker'
import RarePokemonMarker from './RarePokemonMarker'
import NpcMarker from './NpcMarker'
import GymMarker from './GymMarker'
import MapObjectMarker from './MapObjectMarker'
import WorldItemMarker from './WorldItemMarker'
import SpawnAreaPolygon from './SpawnAreaPolygon'
import EventAreaPolygon from './EventAreaPolygon'
import ItemSpawnAreaPolygon from './ItemSpawnAreaPolygon'

import { distanceMeters } from '@/lib/spawner/GeoUtils'
import type {
  ActiveEncounter,
  PlayerPosition,
  SpawnedPokemon,
  WorldItemSpawn,
  WorldSnapshotResponse,
} from '@/types'

const REVEAL_RADIUS_METERS = 80
const CAPTURE_RADIUS_METERS = 30
const ITEM_PICKUP_RADIUS_METERS = 15
const HEAL_RADIUS_METERS = 25

interface GameMapProps {
  playerPosition: PlayerPosition
  snapshot: WorldSnapshotResponse | null
  spawnedPokemon: SpawnedPokemon[]
  partyNeedsHealing: boolean
  onRevealPokemon: (clientId: string) => void
  onEncounter: (encounter: ActiveEncounter) => void
  onPickupItem: (item: WorldItemSpawn) => void
  onHealAtPokecenter: () => void
}

function MapFollower({ position }: { position: PlayerPosition }) {
  const map = useMap()
  useEffect(() => {
    map.panTo([position.latitude, position.longitude], { animate: true, duration: 0.5 })
  }, [map, position.latitude, position.longitude])
  return null
}

function CreatePokemonPane() {
  const map = useMap()
  useLayoutEffect(() => {
    if (!map.getPane('pokemonPane')) {
      const pane = map.createPane('pokemonPane')
      pane.style.zIndex = '620'
    }
  }, [map])
  return null
}

export default function GameMap({
  playerPosition,
  snapshot,
  spawnedPokemon,
  partyNeedsHealing,
  onRevealPokemon,
  onEncounter,
  onPickupItem,
  onHealAtPokecenter,
}: GameMapProps) {
  const playerGeo = { latitude: playerPosition.latitude, longitude: playerPosition.longitude }

  const isInRevealRange = (lat: number, lng: number) =>
    distanceMeters(playerGeo, { latitude: lat, longitude: lng }) <= REVEAL_RADIUS_METERS

  const isInCaptureRange = (lat: number, lng: number) =>
    distanceMeters(playerGeo, { latitude: lat, longitude: lng }) <= CAPTURE_RADIUS_METERS

  const isInPickupRange = (lat: number, lng: number) =>
    distanceMeters(playerGeo, { latitude: lat, longitude: lng }) <= ITEM_PICKUP_RADIUS_METERS

  const isInHealRange = (lat: number, lng: number) =>
    distanceMeters(playerGeo, { latitude: lat, longitude: lng }) <= HEAL_RADIUS_METERS

  return (
    <MapContainer
      center={[playerPosition.latitude, playerPosition.longitude]}
      zoom={18}
      className="w-full h-full"
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      <MapFollower position={playerPosition} />

      {/* Polygonal zones */}
      {snapshot?.spawn_areas.map((area) => (
        <SpawnAreaPolygon key={`spawn-${area.id}`} area={area} />
      ))}
      {snapshot?.event_areas.map((area) => (
        <EventAreaPolygon key={`event-${area.id}`} area={area} />
      ))}
      {snapshot?.item_spawn_areas.map((area) => (
        <ItemSpawnAreaPolygon key={`item-area-${area.id}`} area={area} />
      ))}

      {/* Static map objects */}
      {snapshot?.map_objects.map((obj) => {
        const isPokemonCenter = obj.kind === 'pokemon_center'
        return (
          <MapObjectMarker
            key={`map-${obj.id}`}
            mapObject={obj}
            isInHealRange={
              isPokemonCenter
                ? isInHealRange(obj.location.latitude, obj.location.longitude)
                : false
            }
            canHeal={isPokemonCenter && partyNeedsHealing}
            onHeal={isPokemonCenter ? onHealAtPokecenter : undefined}
          />
        )
      })}

      {/* NPCs */}
      {snapshot?.npcs.map((npc) => (
        <NpcMarker key={`npc-${npc.id}`} npc={npc} />
      ))}

      {/* Gyms */}
      {snapshot?.gyms.map((gym) => (
        <GymMarker key={`gym-${gym.id}`} gym={gym} />
      ))}

      {/* World items */}
      {snapshot?.world_item_spawns.map((item) => (
        <WorldItemMarker
          key={`witem-${item.id}`}
          item={item}
          isInPickupRange={isInPickupRange(item.location.latitude, item.location.longitude)}
          onPickup={onPickupItem}
        />
      ))}

      {/* Rare pokemon (server-placed) */}
      {snapshot?.rare_wild_pokemon.map((rare) => (
        <RarePokemonMarker
          key={`rare-${rare.id}`}
          pokemon={rare}
          isInCaptureRange={isInCaptureRange(rare.location.latitude, rare.location.longitude)}
          onCapture={() =>
            onEncounter({
              kind: 'rare',
              rarePokemonId: rare.id,
              speciesId: rare.species_id,
              speciesName: rare.species_name,
              level: rare.level,
              location: rare.location,
            })
          }
        />
      ))}

      {/* Creates pokemonPane synchronously (useLayoutEffect runs before any
          child useEffect, guaranteeing the pane exists when markers mount) */}
      <CreatePokemonPane />

      {/* Client-spawned common pokemon */}
      {spawnedPokemon.map((poke) => {
        const inReveal = isInRevealRange(poke.location.latitude, poke.location.longitude)
        const inCapture = isInCaptureRange(poke.location.latitude, poke.location.longitude)
        return (
          <SpawnedPokemonMarker
            key={poke.clientId}
            pokemon={poke}
            isInRevealRange={inReveal}
            isInCaptureRange={inCapture}
            onReveal={() => onRevealPokemon(poke.clientId)}
            onCapture={() =>
              onEncounter({
                kind: 'common',
                clientId: poke.clientId,
                speciesId: poke.speciesId,
                speciesName: poke.speciesName,
                level: poke.level,
                location: poke.location,
              })
            }
          />
        )
      })}

      {/* Player */}
      <PlayerMarker position={playerPosition} />
    </MapContainer>
  )
}
