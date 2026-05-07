// game-development-frontend/components/game/player-panel/PokemonListView.tsx

'use client'

import type { PokemonInstance } from '@/types'
import { TYPE_COLORS } from '@/types'

interface PokemonListViewProps {
  pokemon: PokemonInstance[]
}

export default function PokemonListView({ pokemon }: PokemonListViewProps) {
  if (pokemon.length === 0) {
    return (
      <p className="text-center text-slate-400 text-sm py-8">
        You haven&apos;t caught any Pokémon yet.
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {pokemon.map((p) => {
        const hpPct = Math.max(
          0,
          Math.min(100, (p.current_hp / p.effective_stats.max_hp) * 100),
        )
        const hpColor =
          hpPct > 50 ? 'bg-emerald-500' : hpPct > 20 ? 'bg-yellow-500' : 'bg-red-500'
        const primaryColor = TYPE_COLORS[p.species.primary_type] ?? '#94a3b8'

        return (
          <li
            key={p.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/70 border border-slate-700"
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-slate-900 text-xs shrink-0 capitalize"
              style={{ backgroundColor: primaryColor }}
            >
              {p.species.name.slice(0, 3)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-slate-100 capitalize truncate">
                  {p.nickname ?? p.species.name}
                </p>
                <p className="text-xs text-slate-400 shrink-0">Lv. {p.level}</p>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-slate-900 overflow-hidden">
                <div
                  className={`h-full ${hpColor} transition-all`}
                  style={{ width: `${hpPct}%` }}
                />
              </div>
              <p className="mt-0.5 text-[10px] text-slate-400 font-mono">
                HP {p.current_hp}/{p.effective_stats.max_hp}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
