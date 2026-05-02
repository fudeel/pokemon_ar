// game-development-frontend/components/game/SpawnAreaCircle.tsx

'use client'

import { Circle, Tooltip } from 'react-leaflet'
import type { SpawnArea } from '@/types'

interface SpawnAreaCircleProps {
  area: SpawnArea
}

export default function SpawnAreaCircle({ area }: SpawnAreaCircleProps) {
  return (
    <Circle
      center={[area.center.latitude, area.center.longitude]}
      radius={area.radius_meters}
      pathOptions={{
        color: '#22d3ee',
        fillColor: '#22d3ee',
        fillOpacity: 0.04,
        weight: 1,
        dashArray: '4 4',
      }}
    >
      <Tooltip sticky direction="top" opacity={0.9}>
        <span className="text-xs font-semibold">{area.name}</span>
        <br />
        <span className="text-xs text-slate-500">
          {area.pokemon.map((p) => p.species_name).join(', ')}
        </span>
      </Tooltip>
    </Circle>
  )
}
