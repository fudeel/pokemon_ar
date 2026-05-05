// game-development-frontend/components/game/ItemSpawnAreaPolygon.tsx

'use client'

import { Polygon, Tooltip } from 'react-leaflet'
import type { ItemSpawnArea } from '@/types'
import { toLatLngTuples } from './polygonUtils'

interface ItemSpawnAreaPolygonProps {
  area: ItemSpawnArea
}

export default function ItemSpawnAreaPolygon({ area }: ItemSpawnAreaPolygonProps) {
  if (area.polygon.length < 3) return null

  return (
    <Polygon
      positions={toLatLngTuples(area.polygon)}
      pathOptions={{
        color: '#facc15',
        fillColor: '#facc15',
        fillOpacity: 0.05,
        weight: 1,
        dashArray: '2 4',
      }}
    >
      <Tooltip sticky direction="top" opacity={0.9}>
        <span className="text-xs font-semibold">{area.name}</span>
        <br />
        <span className="text-xs text-slate-500">
          {area.items.map((i) => i.item_name).join(', ')}
        </span>
      </Tooltip>
    </Polygon>
  )
}
