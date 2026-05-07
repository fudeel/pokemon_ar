// admin-frontend/app/dashboard/users/[id]/page.tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PasswordResetForm } from '@/components/users/PasswordResetForm'
import { PokecoinsAdjustForm } from '@/components/users/PokecoinsAdjustForm'
import { UserInventoryList } from '@/components/users/UserInventoryList'
import { UserPokemonList } from '@/components/users/UserPokemonList'
import { UserProfileForm } from '@/components/users/UserProfileForm'
import { UserTransactionsList } from '@/components/users/UserTransactionsList'
import { deleteUser, getUser } from '@/lib/api/admin'
import type { PlayerDetail } from '@/types'

function formatDate(value: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString()
}

export default function UserDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const playerId = Number(params.id)

  const [detail, setDetail] = useState<PlayerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!Number.isFinite(playerId) || playerId < 1) {
      setError('Invalid user id.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      setDetail(await getUser(playerId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user.')
    } finally {
      setLoading(false)
    }
  }, [playerId])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async () => {
    if (!detail) return
    const confirmed = window.confirm(
      `Delete user "${detail.player.username}" (id ${detail.player.id})? This removes the player, their Pokémon, inventory and wallet history. This cannot be undone.`,
    )
    if (!confirmed) return
    try {
      await deleteUser(detail.player.id)
      router.push('/dashboard/users')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user.')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="User detail" />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 rounded-full border-2 border-pokered border-t-transparent" />
        </div>
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="flex flex-col h-full">
        <Header title="User detail" />
        <div className="p-6">
          <div className="bg-red-900/20 border border-red-800 rounded px-3 py-2 text-sm text-red-300 mb-3">
            {error ?? 'User not found.'}
          </div>
          <Link href="/dashboard/users">
            <Button variant="secondary">Back to users</Button>
          </Link>
        </div>
      </div>
    )
  }

  const { player, pokemon, inventory, recent_transactions } = detail

  return (
    <div className="flex flex-col h-full overflow-auto">
      <Header
        title={`${player.username} (id ${player.id})`}
        subtitle={player.email}
        actions={
          <>
            <Link href="/dashboard/users">
              <Button size="sm" variant="ghost">Back</Button>
            </Link>
            <Button size="sm" variant="danger" onClick={handleDelete}>Delete user</Button>
          </>
        }
      />

      <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Level</p>
              <p className="text-gray-100">{player.level}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Experience</p>
              <p className="text-gray-100 font-mono">{player.experience.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Pokecoins</p>
              <p className="text-yellow-300 font-mono">
                {player.pokecoins.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Starter</p>
              <p className="text-gray-100">{player.has_chosen_starter ? 'Chosen' : 'Not yet'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Last Seen</p>
              <p className="text-gray-300 text-xs">{formatDate(player.last_seen_at)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Created</p>
              <p className="text-gray-300 text-xs">{formatDate(player.created_at)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Last Known Location</p>
              <p className="text-gray-300 text-xs font-mono">
                {player.location
                  ? `${player.location.latitude.toFixed(6)}, ${player.location.longitude.toFixed(6)}`
                  : '—'}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-gray-100 mb-3">Adjust pokecoins</h2>
          <PokecoinsAdjustForm
            playerId={player.id}
            currentBalance={player.pokecoins}
            onAdjusted={setDetail}
          />
        </Card>

        <Card className="xl:col-span-2">
          <h2 className="text-sm font-semibold text-gray-100 mb-3">Profile</h2>
          <UserProfileForm player={player} onSaved={setDetail} />
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-gray-100 mb-3">Reset password</h2>
          <PasswordResetForm playerId={player.id} />
        </Card>

        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-100">
              Pokémon ({pokemon.length})
            </h2>
          </div>
          <UserPokemonList pokemon={pokemon} />
        </Card>

        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-100">
              Inventory ({inventory.length})
            </h2>
          </div>
          <UserInventoryList inventory={inventory} />
        </Card>

        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-100">
              Recent wallet transactions
            </h2>
            <span className="text-xs text-gray-500">
              Showing the last {recent_transactions.length}
            </span>
          </div>
          <UserTransactionsList transactions={recent_transactions} />
        </Card>
      </div>
    </div>
  )
}
