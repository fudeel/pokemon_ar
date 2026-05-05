// game-development-frontend/components/game/battle/BattleStage.tsx

'use client'

import BattlePokemonFigure from './BattlePokemonFigure'
import BattlePokemonStatus from './BattlePokemonStatus'

import type {
  ActiveEncounter,
  PokemonInstance,
} from '@/types'
import type { BattleCommandMode } from './BattleCommandPanel'

interface BattleStageProps {
  activePokemon: PokemonInstance | null
  commandMode: BattleCommandMode
  encounter: ActiveEncounter
}

export default function BattleStage({
  activePokemon,
  commandMode,
  encounter,
}: BattleStageProps) {
  const activePokemonName = activePokemon
    ? activePokemon.nickname?.trim() || activePokemon.species.name
    : 'No Pokemon'

  return (
    <div className={`battle-stage battle-stage-${commandMode}`}>
      <div className="battle-sky" />
      <div className="battle-field">
        <BattlePokemonStatus
          level={encounter.level}
          name={encounter.speciesName}
          side="enemy"
        />

        <div className="battle-enemy-slot">
          <BattlePokemonFigure
            isEnemy
            isRare={encounter.kind === 'rare'}
            speciesName={encounter.speciesName}
          />
        </div>

        <div className="battle-player-slot">
          {activePokemon ? (
            <BattlePokemonFigure
              pokemon={activePokemon}
              speciesName={activePokemonName}
            />
          ) : (
            <div className="battle-empty-pokemon">No Pokemon</div>
          )}
        </div>

        {activePokemon && (
          <BattlePokemonStatus
            currentHp={activePokemon.current_hp}
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
