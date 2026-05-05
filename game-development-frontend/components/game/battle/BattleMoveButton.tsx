// game-development-frontend/components/game/battle/BattleMoveButton.tsx

'use client'

import type { CSSProperties } from 'react'
import { TYPE_COLORS } from '@/types'
import type { BattleMove } from '@/lib/battle/battleEngine'

interface BattleMoveButtonProps {
  move: BattleMove
  disabled?: boolean
  onClick: () => void
}

/**
 * A single move button showing the move name, type badge and remaining PP.
 * The type badge uses the canonical type colour from TYPE_COLORS.
 */
export default function BattleMoveButton({
  move,
  disabled = false,
  onClick,
}: BattleMoveButtonProps) {
  const typeColor = TYPE_COLORS[move.type] ?? '#a8a77a'
  const hasNopp = move.currentPp <= 0

  return (
    <button
      className="battle-move-button"
      disabled={disabled || hasNopp}
      style={{ '--move-type-color': typeColor } as CSSProperties}
      type="button"
      onClick={onClick}
    >
      <span className="battle-move-name">{move.name}</span>
      <span className="battle-move-type">{move.type.toUpperCase()}</span>
      <span className={`battle-move-pp${hasNopp ? ' battle-move-pp-empty' : ''}`}>
        {move.currentPp}/{move.maxPp}
      </span>
    </button>
  )
}
