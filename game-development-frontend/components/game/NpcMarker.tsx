// game-development-frontend/components/game/NpcMarker.tsx

'use client'

import { useMemo } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { Npc } from '@/types'

const ROLE_ICON: Record<string, string> = {
  merchant: '🛍',
  healer: '💊',
  questgiver: '📜',
  trainer: '⚔',
  auctioneer: '🏷',
}

interface NpcMarkerProps {
  npc: Npc
}

export default function NpcMarker({ npc }: NpcMarkerProps) {
  const icon = useMemo(
    () =>
      L.divIcon({
        html: `
          <div style="
            background:#0f172a;
            border:2px solid #38bdf8;
            border-radius:50%;
            width:30px;height:30px;
            display:flex;align-items:center;justify-content:center;
            font-size:14px;
            box-shadow:0 2px 6px rgba(56,189,248,0.4);
          ">${ROLE_ICON[npc.role] ?? '👤'}</div>
        `,
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      }),
    [npc.role],
  )

  return (
    <Marker position={[npc.location.latitude, npc.location.longitude]} icon={icon}>
      <Popup>
        <p className="font-bold text-sm">{npc.name}</p>
        <p className="text-xs text-slate-500 capitalize">{npc.role}</p>
        {npc.dialogue && <p className="text-xs mt-1 italic">&ldquo;{npc.dialogue}&rdquo;</p>}
      </Popup>
    </Marker>
  )
}
