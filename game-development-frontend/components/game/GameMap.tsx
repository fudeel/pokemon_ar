// game-development-frontend/components/game/GameMap.tsx

'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

import PlayerMarker from './PlayerMarker'
import SpawnedPokemonMarker from './SpawnedPokemonMarker'
import RarePokemonMarker from './RarePokemonMarker'
import NpcMarker from './NpcMarker'
import GymMarker from './GymMarker'
import SpawnAreaCircle from './SpawnAreaCircle'

import { distanceMeters } from '@/lib/spawner/GeoUtils'
import type {
  ActiveEncounter,
  PlayerPosition,
  RareWildPokemon,
  SpawnedPokemon,
  WorldSnapshotResponse,
} from '@/types'

const REVEAL_RADIUS_METERS = 80
const CAPTURE_RADIUS_METERS = 30

interface GameMapProps {
  playerPosition: PlayerPosition
  snapshot: WorldSnapshotResponse | null
  spawnedPokemon: SpawnedPokemon[]
  onRevealPokemon: (clientId: string) => void
  onEncounter: (encounter: ActiveEncounter) => void
}

function MapFollower({ position }: { position: PlayerPosition }) {
  const map = useMap()
  useEffect(() => {
    map.panTo([position.latitude, position.longitude], { animate: true, duration: 0.5 })
  }, [map, position.latitude, position.longitude])
  return null
}

export default function GameMap({
  playerPosition,
  snapshot,
  spawnedPokemon,
  onRevealPokemon,
  onEncounter,
}: GameMapProps) {
  const playerGeo = { latitude: playerPosition.latitude, longitude: playerPosition.longitude }

  const isInRevealRange = (lat: number, lng: number) =>
    distanceMeters(playerGeo, { latitude: lat, longitude: lng }) <= REVEAL_RADIUS_METERS

  const isInCaptureRange = (lat: number, lng: number) =>
    distanceMeters(playerGeo, { latitude: lat, longitude: lng }) <= CAPTURE_RADIUS_METERS

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

      {/* Spawn area zones */}
      {snapshot?.spawn_areas.map((area) => (
        <SpawnAreaCircle key={area.id} area={area} />
      ))}

      {/* NPC markers */}
      {snapshot?.npcs.map((npc) => (
        <NpcMarker key={npc.id} npc={npc} />
      ))}

      {/* Gym markers */}
      {snapshot?.gyms.map((gym) => (
        <GymMarker key={gym.id} gym={gym} />
      ))}

      {/* Rare pokemon markers (server-placed) */}
      {snapshot?.rare_wild_pokemon.map((rare) => (
        <RarePokemonMarker
          key={rare.id}
          pokemon={rare}
          isInCaptureRange={isInCaptureRange(rare.location.latitude, rare.location.longitude)}
          onCapture={() =>
            onEncounter({
              kind: 'rare',
              rarePokemonId: rare.id,
              speciesName: rare.species_name,
              level: rare.level,
              location: rare.location,
            })
          }
        />
      ))}

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
