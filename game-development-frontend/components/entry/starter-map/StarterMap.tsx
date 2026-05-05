// game-development-frontend/components/entry/starter-map/StarterMap.tsx

'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

import PlayerMarker from '@/components/game/PlayerMarker'
import StarterPokeballMarker from './StarterPokeballMarker'
import { distanceMeters } from '@/lib/spawner/GeoUtils'
import type { PlayerPosition } from '@/types'
import type { PlacedStarter } from './starterPlacement'

const PICK_RADIUS_METERS = 30

interface StarterMapProps {
  playerPosition: PlayerPosition
  placements: PlacedStarter[]
  confirmingSpeciesId: number | null
  onChoose: (speciesId: number) => void
}

function MapFollower({ position }: { position: PlayerPosition }) {
  const map = useMap()
  useEffect(() => {
    map.panTo([position.latitude, position.longitude], { animate: true, duration: 0.5 })
  }, [map, position.latitude, position.longitude])
  return null
}

export default function StarterMap({
  playerPosition,
  placements,
  confirmingSpeciesId,
  onChoose,
}: StarterMapProps) {
  const playerGeo = {
    latitude: playerPosition.latitude,
    longitude: playerPosition.longitude,
  }

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

      {placements.map((p) => {
        const inRange =
          distanceMeters(playerGeo, p.location) <= PICK_RADIUS_METERS
        return (
          <StarterPokeballMarker
            key={p.species.id}
            species={p.species}
            latitude={p.location.latitude}
            longitude={p.location.longitude}
            isInPickRange={inRange}
            isConfirming={confirmingSpeciesId === p.species.id}
            onChoose={() => onChoose(p.species.id)}
          />
        )
      })}

      <PlayerMarker position={playerPosition} />
    </MapContainer>
  )
}
