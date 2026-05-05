// game-development-frontend/components/game/battle/BattleTransition.tsx

'use client'

interface BattleTransitionProps {
  isRare: boolean
  speciesName: string
}

export default function BattleTransition({
  isRare,
  speciesName,
}: BattleTransitionProps) {
  return (
    <div className="battle-transition" aria-hidden="true">
      <div className="battle-transition-band battle-transition-band-one" />
      <div className="battle-transition-band battle-transition-band-two" />
      <div className="battle-transition-band battle-transition-band-three" />
      <div className="battle-transition-focus">
        <div className={isRare ? 'battle-transition-rare' : 'battle-transition-common'}>
          {speciesName.charAt(0).toUpperCase()}
        </div>
      </div>
    </div>
  )
}
