// game-development-frontend/components/entry/starter-map/StarterPokeballMarker.tsx

'use client'

import { useMemo, type MouseEvent } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { PokemonSpecies } from '@/types'
import { TYPE_COLORS } from '@/types'

interface StarterPokeballMarkerProps {
  species: PokemonSpecies
  latitude: number
  longitude: number
  isInPickRange: boolean
  isConfirming: boolean
  onChoose: () => void
}

export default function StarterPokeballMarker({
  species,
  latitude,
  longitude,
  isInPickRange,
  isConfirming,
  onChoose,
}: StarterPokeballMarkerProps) {
  const color = TYPE_COLORS[species.primary_type] ?? '#facc15'
  const handleChoose = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    onChoose()
  }

  const icon = useMemo(
    () =>
      L.divIcon({
        html: `
          <div style="
            position:relative;
            width:42px;height:42px;
            display:flex;align-items:center;justify-content:center;
          ">
            <div style="
              position:absolute;inset:0;
              border-radius:50%;
              background:${color};
              opacity:0.25;
              animation:pulse 2s infinite;
            "></div>
            <div style="
              position:relative;
              width:32px;height:32px;
              border-radius:50%;
              background:linear-gradient(180deg,#ef4444 0 50%,#f8fafc 50% 100%);
              border:3px solid #0f172a;
              box-shadow:0 2px 8px rgba(0,0,0,0.5);
              display:flex;align-items:center;justify-content:center;
            ">
              <div style="
                width:8px;height:8px;border-radius:50%;
                background:#0f172a;border:2px solid #f8fafc;
              "></div>
            </div>
          </div>
        `,
        className: '',
        iconSize: [42, 42],
        iconAnchor: [21, 21],
      }),
    [color],
  )

  return (
    <Marker position={[latitude, longitude]} icon={icon} zIndexOffset={500}>
      <Popup>
        <div className="text-center p-1 min-w-[140px]">
          <p className="font-bold text-sm capitalize">{species.name}</p>
          <p className="text-xs text-slate-500 capitalize mb-2">
            {species.primary_type}
            {species.secondary_type ? ` / ${species.secondary_type}` : ''}
          </p>
          {isInPickRange ? (
            <button
              type="button"
              onClick={handleChoose}
              disabled={isConfirming}
              className="bg-yellow-400 hover:bg-yellow-300 disabled:bg-slate-300 text-slate-900 font-bold px-4 py-1.5 rounded-lg text-sm w-full"
            >
              {isConfirming ? 'Choosing…' : 'Choose this Pokémon!'}
            </button>
          ) : (
            <p className="text-xs text-slate-400">Walk closer to choose</p>
          )}
        </div>
      </Popup>
    </Marker>
  )
}
