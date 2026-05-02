// game-development-frontend/components/game/RarePokemonMarker.tsx

'use client'

import { useMemo } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { RareWildPokemon } from '@/types'

interface RarePokemonMarkerProps {
  pokemon: RareWildPokemon
  isInCaptureRange: boolean
  onCapture: () => void
}

export default function RarePokemonMarker({
  pokemon,
  isInCaptureRange,
  onCapture,
}: RarePokemonMarkerProps) {
  const icon = useMemo(
    () =>
      L.divIcon({
        html: `
          <div style="
            background:linear-gradient(135deg,#7c3aed,#4f46e5);
            border:2px solid #a78bfa;
            border-radius:8px;
            padding:3px 8px;
            font-size:11px;
            font-weight:700;
            color:#f1f5f9;
            white-space:nowrap;
            box-shadow:0 2px 12px rgba(124,58,237,0.6);
            position:relative;
          ">
            ✨ ${pokemon.species_name}
            <span style="color:#c4b5fd;font-weight:400"> Lv.${pokemon.level}</span>
            ${isInCaptureRange ? '<div style="width:6px;height:6px;background:#4ade80;border-radius:50%;position:absolute;top:-3px;right:-3px;animation:pulse 1s infinite;"></div>' : ''}
          </div>
        `,
        className: '',
        iconSize: undefined,
        iconAnchor: undefined,
      }),
    [pokemon.species_name, pokemon.level, isInCaptureRange],
  )

  const latlng: [number, number] = [pokemon.location.latitude, pokemon.location.longitude]

  return (
    <Marker position={latlng} icon={icon} zIndexOffset={500}>
      <Popup>
        <div className="text-center p-1">
          <p className="text-purple-600 font-bold text-xs uppercase tracking-wide mb-0.5">
            ✨ Rare Pokémon
          </p>
          <p className="font-bold text-sm">{pokemon.species_name}</p>
          <p className="text-xs text-slate-500 mb-2">Level {pokemon.level}</p>
          {isInCaptureRange ? (
            <button
              onClick={onCapture}
              className="bg-purple-600 text-white font-bold px-4 py-1.5 rounded-lg text-sm hover:bg-purple-500"
            >
              Capture!
            </button>
          ) : (
            <p className="text-xs text-slate-400">Get closer to capture</p>
          )}
        </div>
      </Popup>
    </Marker>
  )
}
