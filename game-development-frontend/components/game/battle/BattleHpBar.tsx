// game-development-frontend/components/game/battle/BattleHpBar.tsx

'use client'

interface BattleHpBarProps {
  current: number
  max: number
}

export default function BattleHpBar({ current, max }: BattleHpBarProps) {
  const percentage = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0
  const tone =
    percentage > 50
      ? 'battle-hp-good'
      : percentage > 20
        ? 'battle-hp-warning'
        : 'battle-hp-danger'

  return (
    <div className="battle-hp-track" aria-label={`${Math.round(percentage)} percent HP`}>
      <div className={`battle-hp-fill ${tone}`} style={{ width: `${percentage}%` }} />
    </div>
  )
}
