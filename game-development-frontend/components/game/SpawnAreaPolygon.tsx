// game-development-frontend/components/game/SpawnAreaPolygon.tsx

'use client'

import { Polygon, Tooltip } from 'react-leaflet'
import type { SpawnArea } from '@/types'
import { toLatLngTuples } from './polygonUtils'

interface SpawnAreaPolygonProps {
  area: SpawnArea
}

export default function SpawnAreaPolygon({ area }: SpawnAreaPolygonProps) {
  if (area.polygon.length < 3) return null

  return (
    <Polygon
      positions={toLatLngTuples(area.polygon)}
      interactive={false}
      pathOptions={{
        color: '#22d3ee',
        fillColor: '#22d3ee',
        fillOpacity: 0.05,
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
    </Polygon>
  )
}
