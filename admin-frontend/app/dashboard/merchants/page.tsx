// admin-frontend/app/dashboard/merchants/page.tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { MerchantForm } from '@/components/merchants/MerchantForm'
import { MerchantList } from '@/components/merchants/MerchantList'
import { deleteMerchant, listItems, listMerchants } from '@/lib/api/admin'
import type { Item, Merchant } from '@/types'

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Merchant | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [merchantList, itemList] = await Promise.all([listMerchants(), listItems()])
      setMerchants(merchantList)
      setItems(itemList)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSaved = useCallback((saved: Merchant) => {
    setMerchants((prev) => {
      const exists = prev.find((m) => m.id === saved.id)
      return exists ? prev.map((m) => (m.id === saved.id ? saved : m)) : [...prev, saved]
    })
    setShowForm(false)
    setEditing(null)
  }, [])

  const handleDelete = useCallback(async (merchant: Merchant) => {
    const confirmed = window.confirm(
      `Delete merchant "${merchant.name}"? Any NPC currently linked to it will lose its catalogue.`,
    )
    if (!confirmed) return
    try {
      await deleteMerchant(merchant.id)
      setMerchants((prev) => prev.filter((m) => m.id !== merchant.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete merchant.')
    }
  }, [])

  const handleClose = useCallback(() => {
    setShowForm(false)
    setEditing(null)
  }, [])

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Merchants"
        subtitle={`${merchants.length} catalogue${merchants.length === 1 ? '' : 's'} · attach to merchant NPCs to enable purchases`}
        actions={
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true) }}>
            + New Merchant
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
          <MerchantList
            merchants={merchants}
            onEdit={(m) => { setEditing(m); setShowForm(true) }}
            onDelete={handleDelete}
          />
        )}
      </div>

      {showForm && (
        <Modal
          title={editing ? `Edit merchant — ${editing.name}` : 'New Merchant'}
          onClose={handleClose}
          width="lg"
        >
          <MerchantForm
            items={items}
            initial={editing ?? undefined}
            onSaved={handleSaved}
            onCancel={handleClose}
          />
        </Modal>
      )}
    </div>
  )
}
