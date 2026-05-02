// admin-frontend/components/species/SpeciesList.tsx
'use client'

import { TypeBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { PokemonSpecies } from '@/types'

interface SpeciesListProps {
  species: PokemonSpecies[]
  onEdit: (species: PokemonSpecies) => void
  onManageMoves: (species: PokemonSpecies) => void
}

export function SpeciesList({ species, onEdit, onManageMoves }: SpeciesListProps) {
  if (species.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <p>No species yet. Add the first one.</p>
      </div>
    )
  }

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-3 text-left">
            <th className="px-4 py-2 text-xs text-gray-400 font-medium w-12">#</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium">Name</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium">Types</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium">HP</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium">Atk</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium">Def</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium">SpA</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium">SpD</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium">Spe</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium">Cap.</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium">Flags</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium w-20"></th>
          </tr>
        </thead>
        <tbody>
          {species
            .slice()
            .sort((a, b) => a.id - b.id)
            .map((s) => (
              <tr
                key={s.id}
                className="border-b border-surface-3 hover:bg-surface-3/40 transition-colors"
              >
                <td className="px-4 py-2 text-gray-400">{s.id}</td>
                <td className="px-4 py-2 font-medium text-gray-100">{s.name}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-1">
                    <TypeBadge type={s.primary_type} />
                    {s.secondary_type && <TypeBadge type={s.secondary_type} />}
                  </div>
                </td>
                <td className="px-4 py-2 text-gray-300">{s.base_stats.hp}</td>
                <td className="px-4 py-2 text-gray-300">{s.base_stats.attack}</td>
                <td className="px-4 py-2 text-gray-300">{s.base_stats.defense}</td>
                <td className="px-4 py-2 text-gray-300">{s.base_stats.special_attack}</td>
                <td className="px-4 py-2 text-gray-300">{s.base_stats.special_defense}</td>
                <td className="px-4 py-2 text-gray-300">{s.base_stats.speed}</td>
                <td className="px-4 py-2 text-gray-300">{s.capture_rate}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-1">
                    {s.is_starter && (
                      <span className="text-xs bg-blue-800 text-blue-200 px-1.5 py-0.5 rounded">Starter</span>
                    )}
                    {s.is_rare && (
                      <span className="text-xs bg-purple-800 text-purple-200 px-1.5 py-0.5 rounded">Rare</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="flex gap-1">
                    <Button size="sm" variant="secondary" onClick={() => onEdit(s)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onManageMoves(s)}>
                      Moves
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}
