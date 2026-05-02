// game-development-frontend/components/entry/StarterCard.tsx

import type { PokemonSpecies } from '@/types'
import { TYPE_COLORS } from '@/types'

interface StarterCardProps {
  species: PokemonSpecies
  isSelected: boolean
  onSelect: () => void
}

export default function StarterCard({ species, isSelected, onSelect }: StarterCardProps) {
  const primaryColor = TYPE_COLORS[species.primary_type] ?? '#888'

  return (
    <button
      onClick={onSelect}
      className={`relative rounded-2xl p-5 border-2 transition-all text-left w-full
        ${isSelected
          ? 'border-yellow-400 bg-slate-700 scale-105 shadow-lg shadow-yellow-400/20'
          : 'border-slate-600 bg-slate-800 hover:border-slate-400'
        }`}
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-3 mx-auto"
        style={{ backgroundColor: `${primaryColor}33`, border: `2px solid ${primaryColor}` }}
      >
        🔴
      </div>

      <p className="text-white font-bold text-center text-lg capitalize">{species.name}</p>

      <div className="flex gap-1 justify-center mt-1 flex-wrap">
        {[species.primary_type, species.secondary_type].filter(Boolean).map((t) => (
          <span
            key={t}
            className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
            style={{ backgroundColor: `${TYPE_COLORS[t!] ?? '#888'}33`, color: TYPE_COLORS[t!] ?? '#888' }}
          >
            {t}
          </span>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-400">
        <StatRow label="HP" value={species.base_stats.hp} />
        <StatRow label="ATK" value={species.base_stats.attack} />
        <StatRow label="DEF" value={species.base_stats.defense} />
        <StatRow label="SPD" value={species.base_stats.speed} />
      </div>

      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-slate-900 text-xs font-bold">
          ✓
        </div>
      )}
    </button>
  )
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <>
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-300 text-right">{value}</span>
    </>
  )
}
