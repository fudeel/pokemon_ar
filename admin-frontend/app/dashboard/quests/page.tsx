// admin-frontend/app/dashboard/quests/page.tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { QuestList } from '@/components/quests/QuestList'
import { QuestForm } from '@/components/quests/QuestForm'
import { deleteQuest, listQuests } from '@/lib/api/admin'
import type { Quest } from '@/types'

export default function QuestsPage() {
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Quest | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setQuests(await listQuests())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSaved = useCallback((saved: Quest) => {
    setQuests((prev) => {
      const exists = prev.find((q) => q.id === saved.id)
      return exists ? prev.map((q) => (q.id === saved.id ? saved : q)) : [...prev, saved]
    })
    setShowForm(false)
    setEditing(null)
  }, [])

  const handleDelete = useCallback(async (quest: Quest) => {
    const confirmed = window.confirm(
      `Delete quest "${quest.title}"? It will be removed from any questgiver NPC that offers it.`,
    )
    if (!confirmed) return
    try {
      await deleteQuest(quest.id)
      setQuests((prev) => prev.filter((q) => q.id !== quest.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete quest.')
    }
  }, [])

  const handleClose = useCallback(() => {
    setShowForm(false)
    setEditing(null)
  }, [])

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Quests"
        subtitle={`${quests.length} quest definitions`}
        actions={
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true) }}>
            + New Quest
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
          <QuestList quests={quests} onEdit={(q) => { setEditing(q); setShowForm(true) }} onDelete={handleDelete} />
        )}
      </div>

      {showForm && (
        <Modal
          title={editing ? `Edit quest — ${editing.title}` : 'New Quest'}
          onClose={handleClose}
          width="lg"
        >
          <QuestForm initial={editing ?? undefined} onSaved={handleSaved} onCancel={handleClose} />
        </Modal>
      )}
    </div>
  )
}
