// game-development-frontend/components/game/battle/BattleStage.tsx

'use client'

import BattlePokemonFigure from './BattlePokemonFigure'
import BattlePokemonStatus from './BattlePokemonStatus'

import type { PokemonInstance } from '@/types'
import type { BattleCommandMode } from './BattleCommandPanel'
import type { WildCombatant } from '@/lib/battle/battleEngine'

interface BattleStageProps {
  activePokemon: PokemonInstance | null
  activePokemonName: string
  commandMode: BattleCommandMode
  playerHp: number
  wild: WildCombatant
}

export default function BattleStage({
  activePokemon,
  activePokemonName,
  commandMode,
  playerHp,
  wild,
}: BattleStageProps) {
  return (
    <div className={`battle-stage battle-stage-${commandMode}`}>
      <div className="battle-sky" />
      <div className="battle-field">

        {/* Enemy status card (top-left) */}
        <BattlePokemonStatus
          currentHp={wild.currentHp}
          level={wild.level}
          maxHp={wild.maxHp}
          name={wild.speciesName}
          side="enemy"
        />

        {/* Enemy pokemon figure (top-right) */}
        <div className="battle-enemy-slot">
          <BattlePokemonFigure
            isEnemy
            isRare={false}
            speciesName={wild.speciesName}
          />
        </div>

        {/* Player pokemon figure (bottom-left) */}
        <div className="battle-player-slot">
          {activePokemon ? (
            <BattlePokemonFigure
              pokemon={activePokemon}
              speciesName={activePokemonName}
            />
          ) : (
            <div className="battle-empty-pokemon">No Pokémon</div>
          )}
        </div>

        {/* Player status card (bottom-right) */}
        {activePokemon && (
          <BattlePokemonStatus
            currentHp={playerHp}
            level={activePokemon.level}
            maxHp={activePokemon.effective_stats.max_hp}
            name={activePokemonName}
            side="player"
          />
        )}

      </div>
    </div>
  )
}
