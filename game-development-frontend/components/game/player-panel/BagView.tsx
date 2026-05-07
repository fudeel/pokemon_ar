// game-development-frontend/components/game/player-panel/BagView.tsx

'use client'

import type { InventorySlot } from '@/types'

const CATEGORY_ICON: Record<string, string> = {
  pokeball: '🔴',
  potion: '🧪',
  revive: '⭐',
  key: '🗝',
  misc: '📦',
}

interface BagViewProps {
  slots: InventorySlot[]
}

export default function BagView({ slots }: BagViewProps) {
  if (slots.length === 0) {
    return (
      <p className="text-center text-slate-400 text-sm py-8">
        Your bag is empty.
      </p>
    )
  }

  const grouped = slots.reduce<Record<string, InventorySlot[]>>((acc, slot) => {
    const key = slot.category
    if (!acc[key]) acc[key] = []
    acc[key].push(slot)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([category, items]) => (
        <section key={category}>
          <h3 className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5 px-1">
            {category}
          </h3>
          <ul className="space-y-1.5">
            {items.map((slot) => (
              <li
                key={slot.item_id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/70 border border-slate-700"
              >
                <div className="w-8 h-8 rounded-md bg-slate-900 border border-slate-700 flex items-center justify-center text-base shrink-0">
                  {CATEGORY_ICON[slot.category] ?? '📦'}
                </div>
                <p className="flex-1 text-sm text-slate-100 truncate">
                  {slot.item_name}
                </p>
                <span className="text-xs font-mono text-slate-300 bg-slate-900 px-2 py-0.5 rounded">
                  ×{slot.quantity}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
