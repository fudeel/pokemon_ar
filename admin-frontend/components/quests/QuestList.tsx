// admin-frontend/components/quests/QuestList.tsx
'use client'

import { Button } from '@/components/ui/Button'
import { QUEST_OBJECTIVE_LABELS, type Quest } from '@/types'

interface QuestListProps {
  quests: Quest[]
  onEdit: (quest: Quest) => void
  onDelete: (quest: Quest) => void
}

export function QuestList({ quests, onEdit, onDelete }: QuestListProps) {
  if (quests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <p>No quests yet. Design the first one.</p>
      </div>
    )
  }

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-3 text-left">
            <th className="px-4 py-2 text-xs text-gray-400 font-medium w-12">#</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium">Title</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium">Min Lv</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium">Objectives</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium">Reward</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium">Flags</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium w-32"></th>
          </tr>
        </thead>
        <tbody>
          {quests
            .slice()
            .sort((a, b) => a.id - b.id)
            .map((q) => (
              <tr key={q.id} className="border-b border-surface-3 hover:bg-surface-3/40 transition-colors align-top">
                <td className="px-4 py-2 text-gray-400">{q.id}</td>
                <td className="px-4 py-2">
                  <div className="font-medium text-gray-100">{q.title}</div>
                  <div className="text-xs text-gray-500 max-w-md line-clamp-2">{q.description}</div>
                </td>
                <td className="px-4 py-2 text-gray-300">{q.minimum_level}</td>
                <td className="px-4 py-2">
                  <div className="flex flex-col gap-0.5">
                    {q.objectives.map((o) => (
                      <span key={o.id} className="text-xs text-gray-400">
                        {o.order}. {QUEST_OBJECTIVE_LABELS[o.objective_type]}
                        {o.target_quantity > 1 ? ` ×${o.target_quantity}` : ''}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="flex flex-col gap-0.5 text-xs text-gray-400">
                    {q.reward.pokecoins > 0 && <span>{q.reward.pokecoins} pokecoins</span>}
                    {q.reward.experience > 0 && <span>{q.reward.experience} XP</span>}
                    {q.reward.items.map((r) => (
                      <span key={r.item_id}>
                        {r.quantity}× {r.item_name}
                      </span>
                    ))}
                    {q.reward.pokecoins === 0 && q.reward.experience === 0 && q.reward.items.length === 0 && (
                      <span className="text-gray-600">—</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="flex flex-col gap-1">
                    {q.is_repeatable && (
                      <span className="text-xs bg-blue-800 text-blue-200 px-1.5 py-0.5 rounded w-fit">
                        Repeatable
                      </span>
                    )}
                    {q.time_limit_seconds != null && (
                      <span className="text-xs bg-yellow-800 text-yellow-200 px-1.5 py-0.5 rounded w-fit">
                        Timed
                      </span>
                    )}
                    {q.follow_up_quest_id != null && (
                      <span className="text-xs bg-purple-800 text-purple-200 px-1.5 py-0.5 rounded w-fit">
                        Chain
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="flex gap-1">
                    <Button size="sm" variant="secondary" onClick={() => onEdit(q)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => onDelete(q)}>
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
