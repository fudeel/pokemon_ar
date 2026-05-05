// game-development-frontend/components/game/battle/BattlePokemonFigure.tsx

'use client'

import type { CSSProperties } from 'react'
import { TYPE_COLORS, type PokemonInstance } from '@/types'

interface BattlePokemonFigureProps {
  isEnemy?: boolean
  isRare?: boolean
  pokemon?: PokemonInstance | null
  speciesName: string
}

export default function BattlePokemonFigure({
  isEnemy = false,
  isRare = false,
  pokemon,
  speciesName,
}: BattlePokemonFigureProps) {
  const typeColor = pokemon
    ? TYPE_COLORS[pokemon.species.primary_type] ?? '#5b8def'
    : isRare
      ? '#8b5cf6'
      : '#ef4444'
  const initial = speciesName.trim().charAt(0).toUpperCase() || '?'

  return (
    <div
      className={`battle-pokemon-figure ${isEnemy ? 'battle-pokemon-enemy' : 'battle-pokemon-player'}`}
      style={{ '--pokemon-color': typeColor } as CSSProperties}
    >
      <div className="battle-pokemon-shadow" />
      <div className="battle-pokemon-body">
        <div className="battle-pokemon-core">{initial}</div>
      </div>
    </div>
  )
}
