// game-development-frontend/components/game/BattleEncounterScreen.tsx

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import BattleCommandPanel, {
  type BattleCommandMode,
} from './battle/BattleCommandPanel'
import BattleStage from './battle/BattleStage'
import BattleTransition from './battle/BattleTransition'

import { captureApi } from '@/lib/api/capture'
import {
  beginBattle,
  executeTurn,
  initBattleState,
  switchActivePokemon,
  type BattleState,
} from '@/lib/battle/battleEngine'

import type {
  ActiveEncounter,
  InventorySlot,
  PlayerPosition,
  PlayerProfile,
} from '@/types'

const INTRO_DURATION_MS = 1_500

interface BattleEncounterScreenProps {
  encounter: ActiveEncounter
  position: PlayerPosition | null
  profile: PlayerProfile | null
  onClose: (captured: boolean) => void
}

export default function BattleEncounterScreen({
  encounter,
  position,
  profile,
  onClose,
}: BattleEncounterScreenProps) {
  const activePokemon = profile?.pokemon[0] ?? null
  const party = useMemo(() => profile?.pokemon.slice(0, 6) ?? [], [profile?.pokemon])
  const bag = useMemo(
    () => compactInventory(profile?.inventory ?? []),
    [profile?.inventory],
  )

  const [battleState, setBattleState] = useState<BattleState | null>(() => {
    if (!activePokemon) return null
    return initBattleState(encounter, activePokemon)
  })
  const [commandMode, setCommandMode] = useState<BattleCommandMode>('root')
  const [captureError, setCaptureError] = useState<string | null>(null)
  const introTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Transition from 'intro' to 'idle' after the entrance animation completes
  useEffect(() => {
    if (!battleState || battleState.phase !== 'intro') return
    introTimerRef.current = setTimeout(() => {
      setBattleState((prev) => (prev ? beginBattle(prev) : null))
    }, INTRO_DURATION_MS)
    return () => {
      if (introTimerRef.current) clearTimeout(introTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleState?.phase])

  // When the active pokemon faints, force party selection or end in defeat
  useEffect(() => {
    if (!battleState || battleState.phase !== 'player_fainted') return
    const backup = party.find(
      (p) => p.id !== battleState.activePokemonId && p.current_hp > 0,
    )
    if (backup) {
      setCommandMode('party')
    } else {
      setBattleState((prev) =>
        prev ? { ...prev, phase: 'all_fainted' } : null,
      )
    }
  }, [battleState?.phase, party])

  const handleMoveSelect = useCallback(
    (moveIndex: number) => {
      setBattleState((prev) => (prev ? executeTurn(prev, moveIndex) : null))
    },
    [],
  )

  const handlePokemonSwitch = useCallback(
    (pokemon: Parameters<typeof switchActivePokemon>[1]) => {
      setBattleState((prev) => (prev ? switchActivePokemon(prev, pokemon) : null))
    },
    [],
  )

  const handleRun = useCallback(() => {
    setBattleState((prev) => (prev ? { ...prev, phase: 'fled' } : null))
    onClose(false)
  }, [onClose])

  const handleUseItem = useCallback(
    async (item: InventorySlot) => {
      if (!battleState || !position) return

      // Only pokeballs are actionable in battle for now
      if (item.category !== 'pokeball') return

      setCaptureError(null)

      try {
        const loc = { latitude: position.latitude, longitude: position.longitude }

        if (encounter.kind === 'rare' && encounter.rarePokemonId !== undefined) {
          const result = await captureApi.captureRare({
            rare_pokemon_id: encounter.rarePokemonId,
            pokeball_item_id: item.item_id,
            player_location: loc,
          })
          const msg = result.success
            ? `Gotcha! ${encounter.speciesName} was caught!`
            : `Oh no! ${encounter.speciesName} broke free!`
          setBattleState((prev) =>
            prev ? { ...prev, log: [...prev.log, msg] } : null,
          )
          if (result.success) {
            setTimeout(() => onClose(true), 1_200)
          }
        } else if (encounter.kind === 'common' && encounter.speciesId !== undefined) {
          const result = await captureApi.captureCommon({
            species_id: encounter.speciesId,
            level: encounter.level,
            pokemon_current_hp: battleState.wild.currentHp,
            pokemon_max_hp: battleState.wild.maxHp,
            pokeball_item_id: item.item_id,
            player_location: loc,
          })
          const msg = result.success
            ? `Gotcha! ${encounter.speciesName} was caught!`
            : `Oh no! ${encounter.speciesName} broke free!`
          setBattleState((prev) =>
            prev ? { ...prev, log: [...prev.log, msg] } : null,
          )
          if (result.success) {
            setTimeout(() => onClose(true), 1_200)
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Capture failed.'
        setCaptureError(msg)
        setBattleState((prev) =>
          prev ? { ...prev, log: [...prev.log, `Capture failed: ${msg}`] } : null,
        )
      }
    },
    [battleState, encounter, position, onClose],
  )

  if (!battleState || !activePokemon) {
    return (
      <section
        aria-label="Pokemon battle"
        className="battle-screen-entry fixed inset-0 z-[3000] grid place-items-center bg-[#89c9a7] text-[#17202a]"
      >
        <p className="font-bold text-xl">No Pokémon available to battle.</p>
        <button
          className="mt-4 battle-command-button px-6"
          type="button"
          onClick={() => onClose(false)}
        >
          Back
        </button>
      </section>
    )
  }

  const currentPokemon = party.find((p) => p.id === battleState.activePokemonId) ?? activePokemon

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
        activePokemon={currentPokemon}
        activePokemonName={battleState.activePokemonName}
        commandMode={commandMode}
        playerHp={battleState.playerHp}
        wild={battleState.wild}
      />

      {captureError && (
        <div className="battle-capture-error" role="alert">
          {captureError}
        </div>
      )}

      <BattleCommandPanel
        activePokemonId={battleState.activePokemonId}
        activePokemonName={battleState.activePokemonName}
        bag={bag}
        commandMode={commandMode}
        log={battleState.log}
        moves={battleState.moves}
        party={party}
        phase={battleState.phase}
        onCommandModeChange={setCommandMode}
        onMoveSelect={handleMoveSelect}
        onPokemonSwitch={handlePokemonSwitch}
        onRun={handleRun}
        onUseItem={handleUseItem}
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
