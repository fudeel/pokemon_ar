// admin-frontend/components/moves/MoveList.tsx
'use client'

import { TypeBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { Move } from '@/types'

interface MoveListProps {
  moves: Move[]
  onEdit: (move: Move) => void
  onDelete: (move: Move) => void
}

export function MoveList({ moves, onEdit, onDelete }: MoveListProps) {
  if (moves.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <p>No moves yet. Create the first one.</p>
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
            <th className="px-4 py-2 text-xs text-gray-400 font-medium">Type</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium">Category</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium">Power</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium">Accuracy</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium">PP</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium w-32"></th>
          </tr>
        </thead>
        <tbody>
          {moves
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((m) => (
              <tr key={m.id} className="border-b border-surface-3 hover:bg-surface-3/40 transition-colors">
                <td className="px-4 py-2 text-gray-400">{m.id}</td>
                <td className="px-4 py-2 font-medium text-gray-100">{m.name}</td>
                <td className="px-4 py-2">
                  <TypeBadge type={m.type} />
                </td>
                <td className="px-4 py-2 text-gray-300 capitalize">{m.category}</td>
                <td className="px-4 py-2 text-gray-300">{m.power ?? '—'}</td>
                <td className="px-4 py-2 text-gray-300">{m.accuracy != null ? `${m.accuracy}%` : '—'}</td>
                <td className="px-4 py-2 text-gray-300">{m.pp}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-1">
                    <Button size="sm" variant="secondary" onClick={() => onEdit(m)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => onDelete(m)}>
                      Delete
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
