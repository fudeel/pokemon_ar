// admin-frontend/app/dashboard/moves/page.tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { MoveList } from '@/components/moves/MoveList'
import { MoveForm } from '@/components/moves/MoveForm'
import { deleteMove, listMoves } from '@/lib/api/admin'
import type { Move } from '@/types'

export default function MovesPage() {
  const [moves, setMoves] = useState<Move[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Move | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setMoves(await listMoves())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSaved = useCallback((saved: Move) => {
    setMoves((prev) => {
      const exists = prev.find((m) => m.id === saved.id)
      return exists ? prev.map((m) => (m.id === saved.id ? saved : m)) : [...prev, saved]
    })
    setShowForm(false)
    setEditing(null)
  }, [])

  const handleDelete = useCallback(async (move: Move) => {
    const confirmed = window.confirm(
      `Delete "${move.name}"? This will remove it from every species that learns it and from any Pokémon currently using it.`,
    )
    if (!confirmed) return
    try {
      await deleteMove(move.id)
      setMoves((prev) => prev.filter((m) => m.id !== move.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete move.')
    }
  }, [])

  const handleClose = useCallback(() => {
    setShowForm(false)
    setEditing(null)
  }, [])

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Moves"
        subtitle={`${moves.length} moves in the library`}
        actions={
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true) }}>
            + New Move
          </Button>
        }
      />

      {error && (
        <div className="px-6 pt-4">
          <div className="bg-red-900/20 border border-red-800 rounded px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 rounded-full border-2 border-pokered border-t-transparent" />
          </div>
        ) : (
          <MoveList moves={moves} onEdit={(m) => { setEditing(m); setShowForm(true) }} onDelete={handleDelete} />
        )}
      </div>

      {showForm && (
        <Modal
          title={editing ? `Edit move — ${editing.name}` : 'New Move'}
          onClose={handleClose}
          width="md"
        >
          <MoveForm initial={editing ?? undefined} onSaved={handleSaved} onCancel={handleClose} />
        </Modal>
      )}
    </div>
  )
}
