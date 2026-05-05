// game-development-frontend/components/game/WorldItemMarker.tsx

'use client'

import { useMemo } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { WorldItemSpawn } from '@/types'

const CATEGORY_ICON: Record<string, string> = {
  pokeball: '⚪',
  potion: '🧪',
  berry: '🍒',
  evolution: '💎',
  key: '🔑',
  tm: '💿',
}

interface WorldItemMarkerProps {
  item: WorldItemSpawn
  isInPickupRange: boolean
  onPickup: (item: WorldItemSpawn) => void
}

export default function WorldItemMarker({
  item,
  isInPickupRange,
  onPickup,
}: WorldItemMarkerProps) {
  const visible = !item.is_hidden || isInPickupRange

  const icon = useMemo(
    () =>
      L.divIcon({
        html: `
          <div style="
            width:26px;height:26px;
            background:#0f172a;
            border:2px solid ${isInPickupRange ? '#4ade80' : '#facc15'};
            border-radius:6px;
            display:flex;align-items:center;justify-content:center;
            font-size:13px;
            box-shadow:0 2px 6px rgba(0,0,0,0.5);
            opacity:${visible ? '1' : '0'};
            transition:opacity 0.3s;
          ">${CATEGORY_ICON[item.item_category] ?? '🎁'}</div>
        `,
        className: '',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      }),
    [item.item_category, isInPickupRange, visible],
  )

  if (!visible) return null

  return (
    <Marker
      position={[item.location.latitude, item.location.longitude]}
      icon={icon}
    >
      <Popup>
        <p className="font-bold text-sm">{item.item_name}</p>
        <p className="text-xs text-slate-500 capitalize">
          {item.item_category} · ×{item.quantity}
        </p>
        {isInPickupRange ? (
          <button
            onClick={() => onPickup(item)}
            className="mt-2 bg-yellow-400 text-slate-900 font-bold px-3 py-1 rounded-md text-xs hover:bg-yellow-300"
          >
            Pick Up
          </button>
        ) : (
          <p className="text-xs text-slate-400 mt-1">Get closer to pick up</p>
        )}
      </Popup>
    </Marker>
  )
}
