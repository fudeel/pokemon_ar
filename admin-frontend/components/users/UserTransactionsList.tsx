// admin-frontend/components/users/UserTransactionsList.tsx
'use client'

import type { WalletTransactionRecord } from '@/types'

function formatDate(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString()
}

interface UserTransactionsListProps {
  transactions: WalletTransactionRecord[]
}

export function UserTransactionsList({ transactions }: UserTransactionsListProps) {
  if (transactions.length === 0) {
    return <p className="text-sm text-gray-500">No wallet transactions yet.</p>
  }

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-3 text-left">
            <th className="px-3 py-2 text-xs text-gray-400 font-medium w-12">#</th>
            <th className="px-3 py-2 text-xs text-gray-400 font-medium">When</th>
            <th className="px-3 py-2 text-xs text-gray-400 font-medium">Type</th>
            <th className="px-3 py-2 text-xs text-gray-400 font-medium">Amount</th>
            <th className="px-3 py-2 text-xs text-gray-400 font-medium">Balance After</th>
            <th className="px-3 py-2 text-xs text-gray-400 font-medium">Notes</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} className="border-b border-surface-3">
              <td className="px-3 py-2 text-gray-400">{tx.id}</td>
              <td className="px-3 py-2 text-gray-400 text-xs">{formatDate(tx.created_at)}</td>
              <td className="px-3 py-2 text-gray-300">{tx.transaction_type}</td>
              <td
                className={`px-3 py-2 font-mono ${
                  tx.amount >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {tx.amount >= 0 ? '+' : ''}
                {tx.amount.toLocaleString()}
              </td>
              <td className="px-3 py-2 text-yellow-300 font-mono">
                {tx.balance_after.toLocaleString()}
              </td>
              <td className="px-3 py-2 text-gray-400 text-xs">{tx.notes ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
