// game-development-frontend/components/game/GymMarker.tsx

'use client'

import { useMemo } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { Gym } from '@/types'

interface GymMarkerProps {
  gym: Gym
}

export default function GymMarker({ gym }: GymMarkerProps) {
  const hasLeader = gym.current_leader_player_id !== null

  const icon = useMemo(
    () =>
      L.divIcon({
        html: `
          <div style="
            background:${hasLeader ? '#7c3aed' : '#0f172a'};
            border:2px solid ${hasLeader ? '#a78bfa' : '#64748b'};
            border-radius:6px;
            padding:2px 6px;
            font-size:11px;
            font-weight:700;
            color:#f1f5f9;
            white-space:nowrap;
            box-shadow:0 2px 8px rgba(0,0,0,0.5);
          ">🏟 ${gym.name}</div>
        `,
        className: '',
        iconSize: undefined,
        iconAnchor: undefined,
      }),
    [gym.name, hasLeader],
  )

  return (
    <Marker position={[gym.location.latitude, gym.location.longitude]} icon={icon}>
      <Popup>
        <p className="font-bold text-sm">{gym.name}</p>
        <p className="text-xs text-slate-500">
          {hasLeader ? `Leader: Trainer #${gym.current_leader_player_id}` : 'No leader — claim it!'}
        </p>
        {gym.defenders.length > 0 && (
          <p className="text-xs mt-1">{gym.defenders.length} defender(s)</p>
        )}
      </Popup>
    </Marker>
  )
}
