// game-development-frontend/components/game/battle/BattlePokemonStatus.tsx

'use client'

import BattleHpBar from './BattleHpBar'

interface BattlePokemonStatusProps {
  currentHp?: number
  level: number
  maxHp?: number
  name: string
  side: 'enemy' | 'player'
}

export default function BattlePokemonStatus({
  currentHp,
  level,
  maxHp,
  name,
  side,
}: BattlePokemonStatusProps) {
  const hasHp = typeof currentHp === 'number' && typeof maxHp === 'number'

  return (
    <aside className={`battle-status-card battle-status-${side}`}>
      <div className="battle-status-heading">
        <strong>{name}</strong>
        <span>Lv. {level}</span>
      </div>
      <div className="battle-status-hp-row">
        <span>HP</span>
        <BattleHpBar current={currentHp ?? 1} max={maxHp ?? 1} />
      </div>
      {hasHp && (
        <p className="battle-status-hp-text">
          {currentHp}/{maxHp}
        </p>
      )}
    </aside>
  )
}
