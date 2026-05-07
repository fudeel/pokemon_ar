// admin-frontend/components/users/UserInventoryList.tsx
'use client'

import type { PlayerInventorySlot } from '@/types'

interface UserInventoryListProps {
  inventory: PlayerInventorySlot[]
}

export function UserInventoryList({ inventory }: UserInventoryListProps) {
  if (inventory.length === 0) {
    return <p className="text-sm text-gray-500">Inventory is empty.</p>
  }

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-3 text-left">
            <th className="px-3 py-2 text-xs text-gray-400 font-medium w-12">#</th>
            <th className="px-3 py-2 text-xs text-gray-400 font-medium">Item</th>
            <th className="px-3 py-2 text-xs text-gray-400 font-medium">Category</th>
            <th className="px-3 py-2 text-xs text-gray-400 font-medium">Quantity</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((slot) => (
            <tr key={slot.item_id} className="border-b border-surface-3">
              <td className="px-3 py-2 text-gray-400">{slot.item_id}</td>
              <td className="px-3 py-2 text-gray-100">{slot.item_name}</td>
              <td className="px-3 py-2 text-gray-300 capitalize">{slot.category}</td>
              <td className="px-3 py-2 text-gray-300">{slot.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
