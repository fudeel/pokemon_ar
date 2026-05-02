// game-development-frontend/components/game/BattleEncounterScreen.tsx

'use client'

import { useState } from 'react'
import type { ActiveEncounter, PlayerProfile } from '@/types'

type EncounterState = 'idle' | 'throwing' | 'success' | 'escaped'

interface BattleEncounterScreenProps {
  encounter: ActiveEncounter
  profile: PlayerProfile | null
  onClose: () => void
  onCaptureSuccess: (clientId?: string) => void
}

export default function BattleEncounterScreen({
  encounter,
  profile,
  onClose,
  onCaptureSuccess,
}: BattleEncounterScreenProps) {
  const [state, setState] = useState<EncounterState>('idle')

  const activePokemon = profile?.pokemon[0] ?? null
  const pokeballs =
    profile?.inventory.find(
      (slot) => slot.category === 'pokeball' && slot.quantity > 0,
    ) ?? null

  const throwPokeball = async () => {
    if (state !== 'idle') return
    setState('throwing')

    await delay(1200)

    if (encounter.kind === 'common') {
      // Common pokemon: client-side capture (server endpoint TBD)
      const catchRoll = Math.random()
      if (catchRoll > 0.3) {
        setState('success')
        await delay(1500)
        onCaptureSuccess(encounter.clientId)
      } else {
        setState('escaped')
        await delay(1500)
        setState('idle')
      }
    } else {
      // Rare pokemon: would call /capture/rare — requires pokeball inventory
      if (!pokeballs) {
        setState('escaped')
        await delay(1500)
        setState('idle')
        return
      }
      setState('success')
      await delay(1500)
      onCaptureSuccess()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900">
      {/* Battle arena */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background grass pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg,#22c55e 0px,#22c55e 1px,transparent 0,transparent 50%)', backgroundSize: '20px 20px' }}
        />

        {/* Wild pokemon side */}
        <div className="absolute top-8 right-8 text-right">
          <div className="bg-slate-800/80 border border-slate-600 rounded-xl px-5 py-3">
            {encounter.kind === 'rare' && (
              <p className="text-purple-400 text-xs font-bold uppercase tracking-wide mb-0.5">✨ Rare</p>
            )}
            <p className="text-white font-bold text-lg">{encounter.speciesName}</p>
            <p className="text-slate-400 text-sm">Lv. {encounter.level}</p>
            <div className="mt-2 h-2 bg-slate-700 rounded-full w-32">
              <div className="h-full bg-green-400 rounded-full w-full" />
            </div>
            <p className="text-slate-500 text-xs mt-0.5">HP</p>
          </div>
        </div>

        {/* Wild pokemon sprite area */}
        <div className="flex items-center justify-center mb-8">
          <div
            className={`w-28 h-28 rounded-full bg-slate-800 border-2 flex items-center justify-center text-5xl
              ${state === 'throwing' ? 'animate-bounce' : ''}
              ${state === 'escaped' ? 'opacity-0 scale-150 transition-all duration-500' : ''}
              ${state === 'success' ? 'opacity-0 scale-0 transition-all duration-500' : ''}
              border-${encounter.kind === 'rare' ? 'purple-500' : 'yellow-400'}
            `}
          >
            🔴
          </div>
        </div>

        {/* Player pokemon side */}
        <div className="absolute bottom-40 left-8">
          <div className="bg-slate-800/80 border border-slate-600 rounded-xl px-5 py-3">
            {activePokemon ? (
              <>
                <p className="text-white font-bold">{activePokemon.nickname ?? activePokemon.species.name}</p>
                <p className="text-slate-400 text-sm">Lv. {activePokemon.level}</p>
                <div className="mt-2 h-2 bg-slate-700 rounded-full w-24">
                  <div
                    className="h-full bg-green-400 rounded-full"
                    style={{
                      width: `${Math.round((activePokemon.current_hp / activePokemon.effective_stats.max_hp) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-slate-500 text-xs mt-0.5">
                  {activePokemon.current_hp}/{activePokemon.effective_stats.max_hp} HP
                </p>
              </>
            ) : (
              <p className="text-slate-400 text-sm">No Pokémon ready</p>
            )}
          </div>
        </div>

        {/* State messages */}
        {state === 'throwing' && (
          <div className="absolute bottom-36 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-600 rounded-lg px-6 py-2 text-white font-semibold">
            Threw a Pokéball…
          </div>
        )}
        {state === 'success' && (
          <div className="absolute bottom-36 left-1/2 -translate-x-1/2 bg-green-700 border border-green-400 rounded-lg px-6 py-2 text-white font-bold animate-pulse">
            Gotcha! {encounter.speciesName} was caught!
          </div>
        )}
        {state === 'escaped' && (
          <div className="absolute bottom-36 left-1/2 -translate-x-1/2 bg-red-800 border border-red-400 rounded-lg px-6 py-2 text-white font-bold">
            Oh no! {encounter.speciesName} broke free!
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="bg-slate-800 border-t border-slate-700 p-4">
        <div className="flex gap-3 max-w-md mx-auto">
          <button
            onClick={throwPokeball}
            disabled={state !== 'idle'}
            className="flex-1 bg-yellow-400 hover:bg-yellow-300 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 font-bold rounded-xl py-4 transition-colors"
          >
            {pokeballs
              ? `Throw Pokéball (${pokeballs.quantity})`
              : 'Throw Pokéball'}
          </button>
          <button
            onClick={onClose}
            disabled={state === 'throwing'}
            className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-semibold rounded-xl px-5 py-4 transition-colors"
          >
            Run
          </button>
        </div>
        {encounter.kind === 'rare' && !pokeballs && (
          <p className="text-center text-red-400 text-xs mt-2">
            No Pokéballs in your bag!
          </p>
        )}
      </div>
    </div>
  )
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
