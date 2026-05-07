// admin-frontend/components/users/UserPokemonList.tsx
'use client'

import type { PokemonInstanceSummary } from '@/types'

interface UserPokemonListProps {
  pokemon: PokemonInstanceSummary[]
}

export function UserPokemonList({ pokemon }: UserPokemonListProps) {
  if (pokemon.length === 0) {
    return <p className="text-sm text-gray-500">This player has no Pokémon.</p>
  }

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-3 text-left">
            <th className="px-3 py-2 text-xs text-gray-400 font-medium w-12">#</th>
            <th className="px-3 py-2 text-xs text-gray-400 font-medium">Species</th>
            <th className="px-3 py-2 text-xs text-gray-400 font-medium">Nickname</th>
            <th className="px-3 py-2 text-xs text-gray-400 font-medium">Level</th>
            <th className="px-3 py-2 text-xs text-gray-400 font-medium">HP</th>
            <th className="px-3 py-2 text-xs text-gray-400 font-medium">XP</th>
          </tr>
        </thead>
        <tbody>
          {pokemon.map((p) => (
            <tr key={p.id} className="border-b border-surface-3">
              <td className="px-3 py-2 text-gray-400">{p.id}</td>
              <td className="px-3 py-2 text-gray-100">{p.species.name}</td>
              <td className="px-3 py-2 text-gray-300">{p.nickname ?? '—'}</td>
              <td className="px-3 py-2 text-gray-300">{p.level}</td>
              <td className="px-3 py-2 text-gray-300">
                {p.current_hp} / {p.effective_stats.max_hp}
              </td>
              <td className="px-3 py-2 text-gray-400 font-mono text-xs">{p.experience}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
