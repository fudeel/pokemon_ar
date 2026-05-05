// game-development-frontend/components/game/battle/BattleCommandPanel.tsx

'use client'

import type {
  ActiveEncounter,
  InventorySlot,
  PokemonInstance,
} from '@/types'

export type BattleCommandMode = 'root' | 'fight' | 'party' | 'bag'

interface BattleCommandPanelProps {
  activePokemon: PokemonInstance | null
  bag: InventorySlot[]
  commandMode: BattleCommandMode
  encounter: ActiveEncounter
  party: PokemonInstance[]
  onCommandModeChange: (mode: BattleCommandMode) => void
  onRun: () => void
}

export default function BattleCommandPanel({
  activePokemon,
  bag,
  commandMode,
  encounter,
  party,
  onCommandModeChange,
  onRun,
}: BattleCommandPanelProps) {
  return (
    <footer className="battle-command-shell">
      <div className="battle-dialogue-box">
        {commandMode === 'root' && (
          <p>
            Wild {encounter.speciesName} appeared.
            {activePokemon ? ` ${pokemonName(activePokemon)} is ready.` : ''}
          </p>
        )}

        {commandMode === 'fight' && (
          <div className="battle-panel-list">
            <p className="battle-muted-line">
              No battle moves are synced for{' '}
              {activePokemon ? pokemonName(activePokemon) : 'this Pokemon'} yet.
            </p>
          </div>
        )}

        {commandMode === 'party' && (
          <div className="battle-party-grid">
            {party.length > 0 ? (
              party.map((pokemon) => (
                <button
                  key={pokemon.id}
                  className="battle-party-card"
                  type="button"
                >
                  <span className="battle-party-name">{pokemonName(pokemon)}</span>
                  <span className="battle-party-meta">Lv. {pokemon.level}</span>
                  <span className="battle-party-hp">
                    {pokemon.current_hp}/{pokemon.effective_stats.max_hp} HP
                  </span>
                </button>
              ))
            ) : (
              <p className="battle-muted-line">No Pokemon are ready.</p>
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
                  type="button"
                >
                  <span>{slot.item_name}</span>
                  <span>x{slot.quantity}</span>
                </button>
              ))
            ) : (
              <p className="battle-muted-line">The bag is empty.</p>
            )}
          </div>
        )}
      </div>

      <nav aria-label="Battle commands" className="battle-command-grid">
        <CommandButton
          isActive={commandMode === 'fight'}
          label="Attack"
          onClick={() => onCommandModeChange('fight')}
        />
        <CommandButton
          isActive={commandMode === 'party'}
          label="Pokemon"
          onClick={() => onCommandModeChange('party')}
        />
        <CommandButton
          isActive={commandMode === 'bag'}
          label="Bag"
          onClick={() => onCommandModeChange('bag')}
        />
        <CommandButton label="Run" onClick={onRun} />
      </nav>
    </footer>
  )
}

function CommandButton({
  isActive = false,
  label,
  onClick,
}: {
  isActive?: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      className={`battle-command-button${isActive ? ' battle-command-button-active' : ''}`}
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  )
}

function pokemonName(pokemon: PokemonInstance): string {
  return pokemon.nickname?.trim() || pokemon.species.name
}
