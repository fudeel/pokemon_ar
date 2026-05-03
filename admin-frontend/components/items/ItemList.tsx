// admin-frontend/components/items/ItemList.tsx
'use client'

import { Button } from '@/components/ui/Button'
import type { Item, ItemEffect } from '@/types'

function formatEffect(effect: ItemEffect | null): string {
  if (!effect) return '—'
  const op = effect.operation === 'delta' ? '+=' : '='
  const value =
    effect.value === null
      ? 'null'
      : typeof effect.value === 'boolean'
        ? String(effect.value)
        : String(effect.value)
  return `${effect.target}.${effect.attribute} ${op} ${value}`
}

interface ItemListProps {
  items: Item[]
  onEdit: (item: Item) => void
  onDelete: (item: Item) => void
}

export function ItemList({ items, onEdit, onDelete }: ItemListProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <p>No items yet. Create the first one.</p>
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
            <th className="px-4 py-2 text-xs text-gray-400 font-medium">Category</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium">Description</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium">Buy</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium">Sell</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium">Effect</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium">Stackable</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium w-32"></th>
          </tr>
        </thead>
        <tbody>
          {items
            .slice()
            .sort((a, b) => a.id - b.id)
            .map((item) => (
              <tr key={item.id} className="border-b border-surface-3 hover:bg-surface-3/40 transition-colors">
                <td className="px-4 py-2 text-gray-400">{item.id}</td>
                <td className="px-4 py-2 font-medium text-gray-100">{item.name}</td>
                <td className="px-4 py-2 text-gray-300 capitalize">{item.category}</td>
                <td className="px-4 py-2 text-gray-400 max-w-xs truncate" title={item.description}>
                  {item.description}
                </td>
                <td className="px-4 py-2 text-gray-300">{item.buy_price ?? '—'}</td>
                <td className="px-4 py-2 text-gray-300">{item.sell_price ?? '—'}</td>
                <td
                  className="px-4 py-2 text-gray-300 font-mono text-xs max-w-xs truncate"
                  title={formatEffect(item.effect)}
                >
                  {formatEffect(item.effect)}
                </td>
                <td className="px-4 py-2 text-gray-300">{item.stackable ? 'Yes' : 'No'}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-1">
                    <Button size="sm" variant="secondary" onClick={() => onEdit(item)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => onDelete(item)}>
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
