// game-development-frontend/components/game/SpawnedPokemonMarker.tsx

'use client'

import { useMemo } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { SpawnedPokemon } from '@/types'

interface SpawnedPokemonMarkerProps {
  pokemon: SpawnedPokemon
  isInRevealRange: boolean
  isInCaptureRange: boolean
  onReveal: () => void
  onCapture: () => void
}

export default function SpawnedPokemonMarker({
  pokemon,
  isInRevealRange,
  isInCaptureRange,
  onReveal,
  onCapture,
}: SpawnedPokemonMarkerProps) {
  const icon = useMemo(() => {
    if (!pokemon.isRevealed) {
      return L.divIcon({
        html: `
          <div style="
            width:32px;height:32px;
            background:#1e293b;
            border:2px solid #475569;
            border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            font-size:16px;
            box-shadow:0 2px 6px rgba(0,0,0,0.5);
            opacity:${isInRevealRange ? '1' : '0'};
            transition:opacity 0.3s;
          ">?</div>
        `,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })
    }

    return L.divIcon({
      html: `
        <div style="
          background:#1e293b;
          border:2px solid ${isInCaptureRange ? '#4ade80' : '#facc15'};
          border-radius:8px;
          padding:3px 7px;
          font-size:11px;
          font-weight:700;
          color:#f1f5f9;
          white-space:nowrap;
          box-shadow:0 2px 8px rgba(0,0,0,0.6);
          position:relative;
        ">
          🔴 ${pokemon.speciesName}
          <span style="color:#94a3b8;font-weight:400"> Lv.${pokemon.level}</span>
          ${isInCaptureRange ? '<div style="width:6px;height:6px;background:#4ade80;border-radius:50%;position:absolute;top:-3px;right:-3px;"></div>' : ''}
        </div>
      `,
      className: '',
      iconSize: undefined,
      iconAnchor: undefined,
    })
  }, [pokemon.isRevealed, pokemon.speciesName, pokemon.level, isInRevealRange, isInCaptureRange])

  if (!isInRevealRange && !pokemon.isRevealed) return null

  const latlng: [number, number] = [pokemon.location.latitude, pokemon.location.longitude]

  return (
    <Marker position={latlng} icon={icon}>
      <Popup>
        {!pokemon.isRevealed ? (
          <div className="text-center p-1">
            <p className="font-bold text-sm mb-2">A wild Pokémon is near!</p>
            <button
              onClick={onReveal}
              className="bg-yellow-400 text-slate-900 font-bold px-4 py-1.5 rounded-lg text-sm hover:bg-yellow-300"
            >
              Reveal
            </button>
          </div>
        ) : (
          <div className="text-center p-1">
            <p className="font-bold text-sm">{pokemon.speciesName}</p>
            <p className="text-xs text-slate-500 mb-2">Level {pokemon.level}</p>
            {isInCaptureRange ? (
              <button
                onClick={onCapture}
                className="bg-green-500 text-white font-bold px-4 py-1.5 rounded-lg text-sm hover:bg-green-400"
              >
                Capture!
              </button>
            ) : (
              <p className="text-xs text-slate-400">Get closer to capture</p>
            )}
          </div>
        )}
      </Popup>
    </Marker>
  )
}
