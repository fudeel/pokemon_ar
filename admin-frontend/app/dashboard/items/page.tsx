// admin-frontend/app/dashboard/items/page.tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ItemList } from '@/components/items/ItemList'
import { ItemForm } from '@/components/items/ItemForm'
import { deleteItem, listItems } from '@/lib/api/admin'
import type { Item } from '@/types'

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await listItems())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSaved = useCallback((saved: Item) => {
    setItems((prev) => {
      const exists = prev.find((i) => i.id === saved.id)
      return exists ? prev.map((i) => (i.id === saved.id ? saved : i)) : [...prev, saved]
    })
    setShowForm(false)
    setEditing(null)
  }, [])

  const handleDelete = useCallback(async (item: Item) => {
    const confirmed = window.confirm(
      `Delete "${item.name}"? It will be removed from every player's inventory and any quest reward referencing it.`,
    )
    if (!confirmed) return
    try {
      await deleteItem(item.id)
      setItems((prev) => prev.filter((i) => i.id !== item.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item.')
    }
  }, [])

  const handleClose = useCallback(() => {
    setShowForm(false)
    setEditing(null)
  }, [])

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Items"
        subtitle={`${items.length} items in the catalogue`}
        actions={
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true) }}>
            + New Item
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
          <ItemList items={items} onEdit={(i) => { setEditing(i); setShowForm(true) }} onDelete={handleDelete} />
        )}
      </div>

      {showForm && (
        <Modal
          title={editing ? `Edit item — ${editing.name}` : 'New Item'}
          onClose={handleClose}
          width="lg"
        >
          <ItemForm initial={editing ?? undefined} onSaved={handleSaved} onCancel={handleClose} />
        </Modal>
      )}
    </div>
  )
}
