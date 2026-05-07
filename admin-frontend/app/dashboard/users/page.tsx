// admin-frontend/app/dashboard/users/page.tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { UserList } from '@/components/users/UserList'
import { deleteUser, listUsers } from '@/lib/api/admin'
import type { PlayerListPage, PlayerSummary } from '@/types'

const PAGE_SIZE = 25

export default function UsersPage() {
  const [page, setPage] = useState<PlayerListPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [offset, setOffset] = useState(0)

  const load = useCallback(
    async (currentOffset: number, currentSearch: string) => {
      setLoading(true)
      setError(null)
      try {
        const result = await listUsers({
          limit: PAGE_SIZE,
          offset: currentOffset,
          search: currentSearch || undefined,
        })
        setPage(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users.')
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    load(offset, appliedSearch)
  }, [load, offset, appliedSearch])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setOffset(0)
    setAppliedSearch(search.trim())
  }

  const handleClearSearch = () => {
    setSearch('')
    setAppliedSearch('')
    setOffset(0)
  }

  const handleDelete = useCallback(
    async (user: PlayerSummary) => {
      const confirmed = window.confirm(
        `Delete user "${user.username}" (id ${user.id})? This removes the player, their Pokémon, inventory and wallet history. This cannot be undone.`,
      )
      if (!confirmed) return
      try {
        await deleteUser(user.id)
        await load(offset, appliedSearch)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete user.')
      }
    },
    [load, offset, appliedSearch],
  )

  const total = page?.total ?? 0
  const showingFrom = total === 0 ? 0 : offset + 1
  const showingTo = page ? offset + page.items.length : 0

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Users"
        subtitle={
          page
            ? `Showing ${showingFrom}-${showingTo} of ${total}`
            : 'Manage registered players'
        }
      />

      <div className="px-6 pt-4">
        <form onSubmit={handleSearchSubmit} className="flex items-end gap-2 max-w-xl">
          <div className="flex-1">
            <Input
              label="Search by username or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ash, ash@example.com"
              maxLength={128}
            />
          </div>
          <Button type="submit" size="md">Search</Button>
          {appliedSearch && (
            <Button type="button" size="md" variant="ghost" onClick={handleClearSearch}>
              Clear
            </Button>
          )}
        </form>
      </div>

      {error && (
        <div className="px-6 pt-4">
          <div className="bg-red-900/20 border border-red-800 rounded px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto px-2 pt-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 rounded-full border-2 border-pokered border-t-transparent" />
          </div>
        ) : page ? (
          <UserList users={page.items} onDelete={handleDelete} />
        ) : null}
      </div>

      {page && total > PAGE_SIZE && (
        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-surface-3">
          <Button
            size="sm"
            variant="ghost"
            disabled={offset === 0 || loading}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={loading || offset + PAGE_SIZE >= total}
            onClick={() => setOffset(offset + PAGE_SIZE)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
