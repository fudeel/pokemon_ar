// game-development-frontend/components/game/BattleEncounterScreen.tsx

'use client'

import { useMemo, useState } from 'react'

import BattleCommandPanel, {
  type BattleCommandMode,
} from './battle/BattleCommandPanel'
import BattleStage from './battle/BattleStage'
import BattleTransition from './battle/BattleTransition'

import type { ActiveEncounter, InventorySlot, PlayerProfile } from '@/types'

interface BattleEncounterScreenProps {
  encounter: ActiveEncounter
  profile: PlayerProfile | null
  onClose: () => void
}

export default function BattleEncounterScreen({
  encounter,
  profile,
  onClose,
}: BattleEncounterScreenProps) {
  const [commandMode, setCommandMode] = useState<BattleCommandMode>('root')

  const activePokemon = profile?.pokemon[0] ?? null
  const party = useMemo(() => profile?.pokemon.slice(0, 6) ?? [], [profile?.pokemon])
  const bag = useMemo(
    () => compactInventory(profile?.inventory ?? []),
    [profile?.inventory],
  )

  return (
    <section
      aria-label="Pokemon battle"
      className="battle-screen-entry fixed inset-0 z-[3000] grid grid-rows-[1fr_auto] overflow-hidden bg-[#89c9a7] text-[#17202a]"
    >
      <BattleTransition
        isRare={encounter.kind === 'rare'}
        speciesName={encounter.speciesName}
      />

      <BattleStage
        activePokemon={activePokemon}
        commandMode={commandMode}
        encounter={encounter}
      />

      <BattleCommandPanel
        activePokemon={activePokemon}
        bag={bag}
        commandMode={commandMode}
        encounter={encounter}
        party={party}
        onCommandModeChange={setCommandMode}
        onRun={onClose}
      />
    </section>
  )
}

function compactInventory(inventory: InventorySlot[]): InventorySlot[] {
  return inventory
    .filter((slot) => slot.quantity > 0)
    .sort((a, b) => {
      if (a.category === b.category) return a.item_name.localeCompare(b.item_name)
      return a.category.localeCompare(b.category)
    })
}
