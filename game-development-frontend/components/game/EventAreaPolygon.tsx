// game-development-frontend/components/game/EventAreaPolygon.tsx

'use client'

import { Polygon, Tooltip } from 'react-leaflet'
import type { EventArea } from '@/types'
import { toLatLngTuples } from './polygonUtils'

interface EventAreaPolygonProps {
  area: EventArea
}

export default function EventAreaPolygon({ area }: EventAreaPolygonProps) {
  if (area.polygon.length < 3) return null

  return (
    <Polygon
      positions={toLatLngTuples(area.polygon)}
      pathOptions={{
        color: '#f472b6',
        fillColor: '#f472b6',
        fillOpacity: 0.10,
        weight: 2,
        dashArray: '6 3',
      }}
    >
      <Tooltip sticky direction="top" opacity={0.9}>
        <span className="text-xs font-bold uppercase tracking-wide text-pink-500">
          ✨ Event
        </span>
        <br />
        <span className="text-xs font-semibold">{area.name}</span>
        {area.description && (
          <>
            <br />
            <span className="text-xs text-slate-500">{area.description}</span>
          </>
        )}
      </Tooltip>
    </Polygon>
  )
}
