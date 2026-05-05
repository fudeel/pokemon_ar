// game-development-frontend/components/game/battle/BattleCommandPanel.tsx

'use client'

import BattleLog from './BattleLog'
import BattleMoveButton from './BattleMoveButton'

import type { InventorySlot, PokemonInstance } from '@/types'
import type { BattleMove, BattlePhase } from '@/lib/battle/battleEngine'

export type BattleCommandMode = 'root' | 'fight' | 'party' | 'bag'

interface BattleCommandPanelProps {
  activePokemonName: string
  bag: InventorySlot[]
  commandMode: BattleCommandMode
  log: string[]
  moves: BattleMove[]
  party: PokemonInstance[]
  phase: BattlePhase
  activePokemonId: number
  onCommandModeChange: (mode: BattleCommandMode) => void
  onMoveSelect: (moveIndex: number) => void
  onPokemonSwitch: (pokemon: PokemonInstance) => void
  onUseItem: (item: InventorySlot) => void
  onRun: () => void
}

export default function BattleCommandPanel({
  activePokemonName,
  bag,
  commandMode,
  log,
  moves,
  party,
  phase,
  activePokemonId,
  onCommandModeChange,
  onMoveSelect,
  onPokemonSwitch,
  onUseItem,
  onRun,
}: BattleCommandPanelProps) {
  const isResolving = phase === 'resolving'
  const isEnemyFainted = phase === 'enemy_fainted'
  const isPlayerFainted = phase === 'player_fainted' || phase === 'all_fainted'
  const isBattleOver = isEnemyFainted || phase === 'all_fainted' || phase === 'fled'

  return (
    <footer className="battle-command-shell">
      <div className="battle-dialogue-box">

        {commandMode === 'root' && (
          <BattleLog messages={log} />
        )}

        {commandMode === 'fight' && (
          <div className="battle-move-grid">
            {moves.length > 0 ? (
              moves.map((move, index) => (
                <BattleMoveButton
                  key={move.slot}
                  move={move}
                  disabled={isResolving || isBattleOver}
                  onClick={() => {
                    onMoveSelect(index)
                    onCommandModeChange('root')
                  }}
                />
              ))
            ) : (
              <p className="battle-muted-line">
                {activePokemonName} has no moves yet.
              </p>
            )}
          </div>
        )}

        {commandMode === 'party' && (
          <div className="battle-party-grid">
            {party.length > 0 ? (
              party.map((pokemon) => {
                const name = pokemon.nickname?.trim() || pokemon.species.name
                const isActive = pokemon.id === activePokemonId
                const isFainted = pokemon.current_hp <= 0
                return (
                  <button
                    key={pokemon.id}
                    className={`battle-party-card${isActive ? ' battle-party-card-active' : ''}${isFainted ? ' battle-party-card-fainted' : ''}`}
                    disabled={isActive || isFainted || isResolving}
                    type="button"
                    onClick={() => {
                      onPokemonSwitch(pokemon)
                      onCommandModeChange('root')
                    }}
                  >
                    <span className="battle-party-name">{name}</span>
                    <span className="battle-party-meta">Lv.{pokemon.level}</span>
                    <span className="battle-party-hp">
                      {pokemon.current_hp}/{pokemon.effective_stats.max_hp} HP
                    </span>
                  </button>
                )
              })
            ) : (
              <p className="battle-muted-line">No Pokémon ready.</p>
            )}
          </div>
        )}

        {commandMode === 'bag' && (
          <div className="battle-bag-list">
            {bag.length > 0 ? (
              bag.map((slot) => (
                <button
                  key={`${slot.item_id}-${slot.category}`}
                  className="battle-bag-row"
                  disabled={isResolving}
                  type="button"
                  onClick={() => {
                    onUseItem(slot)
                    onCommandModeChange('root')
                  }}
                >
                  <span>{slot.item_name}</span>
                  <span>×{slot.quantity}</span>
                </button>
              ))
            ) : (
              <p className="battle-muted-line">Bag is empty.</p>
            )}
          </div>
        )}

      </div>

      <nav aria-label="Battle commands" className="battle-command-grid">
        {commandMode !== 'root' ? (
          <>
            <CommandButton
              label="← Back"
              onClick={() => onCommandModeChange('root')}
            />
          </>
        ) : (
          <>
            <CommandButton
              disabled={isResolving || isBattleOver || isPlayerFainted}
              isActive={commandMode === 'fight'}
              label="Fight"
              onClick={() => onCommandModeChange('fight')}
            />
            <CommandButton
              disabled={isResolving || isBattleOver}
              isActive={commandMode === 'bag'}
              label="Bag"
              onClick={() => onCommandModeChange('bag')}
            />
            <CommandButton
              disabled={isResolving || isBattleOver}
              isActive={commandMode === 'party'}
              label="Pokémon"
              onClick={() => onCommandModeChange('party')}
            />
            <CommandButton
              disabled={isResolving}
              label="Run"
              onClick={onRun}
            />
          </>
        )}
      </nav>
    </footer>
  )
}

function CommandButton({
  disabled = false,
  isActive = false,
  label,
  onClick,
}: {
  disabled?: boolean
  isActive?: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      className={`battle-command-button${isActive ? ' battle-command-button-active' : ''}${disabled ? ' battle-command-button-disabled' : ''}`}
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  )
}
