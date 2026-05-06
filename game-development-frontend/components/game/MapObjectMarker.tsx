// game-development-frontend/components/game/MapObjectMarker.tsx

'use client'

import { useMemo } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { MapObject } from '@/types'

const KIND_ICON: Record<string, string> = {
  pokestop: '🔷',
  landmark: '🏛',
  shop: '🏪',
  pokemon_center: '🏥',
  quest_board: '📋',
  auction_house: '🏷',
}

const KIND_COLOR: Record<string, string> = {
  pokestop: '#38bdf8',
  landmark: '#94a3b8',
  shop: '#fbbf24',
  pokemon_center: '#f87171',
  quest_board: '#a3e635',
  auction_house: '#c084fc',
}

interface MapObjectMarkerProps {
  mapObject: MapObject
  isInHealRange?: boolean
  canHeal?: boolean
  onHeal?: () => void
}

export default function MapObjectMarker({
  mapObject,
  isInHealRange = false,
  canHeal = false,
  onHeal,
}: MapObjectMarkerProps) {
  const color = KIND_COLOR[mapObject.kind] ?? '#94a3b8'
  const glyph = KIND_ICON[mapObject.kind] ?? '📍'

  const icon = useMemo(
    () =>
      L.divIcon({
        html: `
          <div style="
            background:#0f172a;
            border:2px solid ${color};
            border-radius:50%;
            width:30px;height:30px;
            display:flex;align-items:center;justify-content:center;
            font-size:13px;
            box-shadow:0 2px 6px rgba(0,0,0,0.5);
          ">${glyph}</div>
        `,
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      }),
    [color, glyph],
  )

  const isPokemonCenter = mapObject.kind === 'pokemon_center'

  return (
    <Marker
      position={[mapObject.location.latitude, mapObject.location.longitude]}
      icon={icon}
    >
      <Popup>
        <p className="font-bold text-sm">{mapObject.name ?? 'Map Object'}</p>
        <p className="text-xs text-slate-500 capitalize">
          {mapObject.kind.replace('_', ' ')}
        </p>
        {isPokemonCenter && (
          <div className="mt-2 text-center">
            {!isInHealRange ? (
              <p className="text-xs text-slate-400">Get closer to heal your party</p>
            ) : !canHeal ? (
              <p className="text-xs text-slate-400">Your party is already at full HP</p>
            ) : (
              <button
                onClick={onHeal}
                className="bg-red-500 text-white font-bold px-4 py-1.5 rounded-lg text-sm hover:bg-red-400"
              >
                Heal Party
              </button>
            )}
          </div>
        )}
      </Popup>
    </Marker>
  )
}
