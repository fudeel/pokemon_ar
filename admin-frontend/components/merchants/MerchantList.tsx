// admin-frontend/components/merchants/MerchantList.tsx
'use client'

import { Button } from '@/components/ui/Button'
import type { Merchant } from '@/types'

interface MerchantListProps {
  merchants: Merchant[]
  onEdit: (merchant: Merchant) => void
  onDelete: (merchant: Merchant) => void
}

export function MerchantList({ merchants, onEdit, onDelete }: MerchantListProps) {
  if (merchants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <p>No merchants yet. Create the first one.</p>
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
            <th className="px-4 py-2 text-xs text-gray-400 font-medium">Description</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium">Items</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium w-32"></th>
          </tr>
        </thead>
        <tbody>
          {merchants
            .slice()
            .sort((a, b) => a.id - b.id)
            .map((merchant) => (
              <tr key={merchant.id} className="border-b border-surface-3 hover:bg-surface-3/40 transition-colors align-top">
                <td className="px-4 py-3 text-gray-400">{merchant.id}</td>
                <td className="px-4 py-3 font-medium text-gray-100">{merchant.name}</td>
                <td className="px-4 py-3 text-gray-400 max-w-xs">
                  {merchant.description ?? <span className="italic text-gray-600">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-300">
                  {merchant.items.length === 0 ? (
                    <span className="italic text-gray-500">empty</span>
                  ) : (
                    <ul className="space-y-0.5">
                      {merchant.items.map((it) => (
                        <li key={it.item_id} className="flex justify-between gap-3 text-xs">
                          <span>{it.item_name}</span>
                          <span className="text-gray-400">
                            {it.effective_price}
                            {it.price_override !== null && (
                              <span className="ml-1 text-amber-400" title="Price override active">
                                *
                              </span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button size="sm" variant="secondary" onClick={() => onEdit(merchant)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => onDelete(merchant)}>
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
