// game-development-frontend/components/game/PlayerMarker.tsx

'use client'

import { useMemo } from 'react'
import { Marker, Circle } from 'react-leaflet'
import L from 'leaflet'
import type { PlayerPosition } from '@/types'

interface PlayerMarkerProps {
  position: PlayerPosition
}

const CAPTURE_RADIUS_METERS = 30
const REVEAL_RADIUS_METERS = 80

export default function PlayerMarker({ position }: PlayerMarkerProps) {
  const icon = useMemo(
    () =>
      L.divIcon({
        html: `
          <div style="
            width:20px;height:20px;
            background:#facc15;
            border:3px solid #fff;
            border-radius:50%;
            box-shadow:0 0 0 3px rgba(250,204,21,0.4);
          "></div>
        `,
        className: '',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      }),
    [],
  )

  const latlng: [number, number] = [position.latitude, position.longitude]

  return (
    <>
      <Marker position={latlng} icon={icon} zIndexOffset={1000} />
      <Circle
        center={latlng}
        radius={REVEAL_RADIUS_METERS}
        pathOptions={{ color: '#facc15', fillColor: '#facc15', fillOpacity: 0.06, weight: 1 }}
      />
      <Circle
        center={latlng}
        radius={CAPTURE_RADIUS_METERS}
        pathOptions={{ color: '#4ade80', fillColor: '#4ade80', fillOpacity: 0.10, weight: 1 }}
      />
    </>
  )
}
