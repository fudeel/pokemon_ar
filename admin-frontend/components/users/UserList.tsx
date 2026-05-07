// admin-frontend/components/users/UserList.tsx
'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import type { PlayerSummary } from '@/types'

function formatDate(value: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString()
}

interface UserListProps {
  users: PlayerSummary[]
  onDelete: (user: PlayerSummary) => void
}

export function UserList({ users, onDelete }: UserListProps) {
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <p>No users match the current filters.</p>
      </div>
    )
  }

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-3 text-left">
            <th className="px-4 py-2 text-xs text-gray-400 font-medium w-12">#</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium">Username</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium">Email</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium">Level</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium">Pokecoins</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium">Starter</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium">Last Seen</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium">Created</th>
            <th className="px-4 py-2 text-xs text-gray-400 font-medium w-44"></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-surface-3 hover:bg-surface-3/40 transition-colors">
              <td className="px-4 py-2 text-gray-400">{u.id}</td>
              <td className="px-4 py-2 font-medium text-gray-100">{u.username}</td>
              <td className="px-4 py-2 text-gray-300">{u.email}</td>
              <td className="px-4 py-2 text-gray-300">{u.level}</td>
              <td className="px-4 py-2 text-yellow-300 font-mono">{u.pokecoins.toLocaleString()}</td>
              <td className="px-4 py-2 text-gray-300">{u.has_chosen_starter ? 'Yes' : 'No'}</td>
              <td className="px-4 py-2 text-gray-400 text-xs">{formatDate(u.last_seen_at)}</td>
              <td className="px-4 py-2 text-gray-400 text-xs">{formatDate(u.created_at)}</td>
              <td className="px-4 py-2">
                <div className="flex gap-1 justify-end">
                  <Link href={`/dashboard/users/${u.id}`}>
                    <Button size="sm" variant="secondary">View / Edit</Button>
                  </Link>
                  <Button size="sm" variant="danger" onClick={() => onDelete(u)}>Delete</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
