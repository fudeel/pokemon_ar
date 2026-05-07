// admin-frontend/components/map/EditMerchantNpcModal.tsx
'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { MerchantForm } from '@/components/merchants/MerchantForm'
import { assignNpcMerchant } from '@/lib/api/admin'
import type { Item, Merchant, Npc } from '@/types'

interface EditMerchantNpcModalProps {
  npc: Npc
  merchants: Merchant[]
  items: Item[]
  onNpcUpdated: (npc: Npc) => void
  onMerchantSaved: (merchant: Merchant) => void
  onClose: () => void
}

type EditorMode = 'idle' | 'editing-existing' | 'creating-new'

export function EditMerchantNpcModal({
  npc,
  merchants,
  items,
  onNpcUpdated,
  onMerchantSaved,
  onClose,
}: EditMerchantNpcModalProps) {
  const [merchantId, setMerchantId] = useState<string>(
    npc.merchant_id !== null ? String(npc.merchant_id) : '',
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<EditorMode>('idle')

  const selectedMerchant = merchants.find((m) => String(m.id) === merchantId) ?? null
  const isAssignmentDirty =
    (npc.merchant_id ?? null) !== (merchantId === '' ? null : Number(merchantId))

  const handleSaveAssignment = async () => {
    setError(null)
    setSaving(true)
    try {
      const updated = await assignNpcMerchant(
        npc.id,
        merchantId === '' ? null : Number(merchantId),
      )
      onNpcUpdated(updated)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update merchant assignment')
    } finally {
      setSaving(false)
    }
  }

  const handleMerchantSaved = (merchant: Merchant) => {
    onMerchantSaved(merchant)
    setMerchantId(String(merchant.id))
    setMode('idle')
  }

  if (mode === 'creating-new') {
    return (
      <Modal title="New Merchant Catalogue" onClose={() => setMode('idle')} width="lg">
        <MerchantForm
          items={items}
          onSaved={handleMerchantSaved}
          onCancel={() => setMode('idle')}
        />
      </Modal>
    )
  }

  if (mode === 'editing-existing' && selectedMerchant) {
    return (
      <Modal
        title={`Edit catalogue — ${selectedMerchant.name}`}
        onClose={() => setMode('idle')}
        width="lg"
      >
        <MerchantForm
          items={items}
          initial={selectedMerchant}
          onSaved={handleMerchantSaved}
          onCancel={() => setMode('idle')}
        />
      </Modal>
    )
  }

  return (
    <Modal title={`Edit Shop — ${npc.name}`} onClose={onClose} width="md">
      <div className="flex flex-col gap-4">
        <ErrorMessage message={error} />

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Select
              label="Merchant catalogue"
              value={merchantId}
              onChange={(e) => setMerchantId(e.target.value)}
              options={[
                { value: '', label: '— no catalogue —' },
                ...merchants.map((m) => ({
                  value: String(m.id),
                  label: `${m.name} (${m.items.length} item${m.items.length === 1 ? '' : 's'})`,
                })),
              ]}
            />
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setMode('creating-new')}>
            + New
          </Button>
        </div>

        {selectedMerchant ? (
          <div className="bg-surface-3 rounded p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-300">{selectedMerchant.name}</span>
              <button
                type="button"
                onClick={() => setMode('editing-existing')}
                className="text-xs text-pokered hover:underline"
              >
                Edit items
              </button>
            </div>
            {selectedMerchant.description && (
              <p className="text-xs text-gray-400">{selectedMerchant.description}</p>
            )}
            {selectedMerchant.items.length === 0 ? (
              <p className="text-xs italic text-gray-500">No items configured.</p>
            ) : (
              <ul className="space-y-0.5 max-h-44 overflow-auto">
                {selectedMerchant.items.map((it) => (
                  <li key={it.item_id} className="flex justify-between text-xs">
                    <span className="text-gray-200">{it.item_name}</span>
                    <span className="text-gray-400">
                      {it.effective_price}¢
                      {it.price_override !== null && (
                        <span className="ml-1 text-amber-400" title="Price override">*</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-500">
            Pick a catalogue or create a new one. Without one, players can&apos;t buy from this NPC.
          </p>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            onClick={handleSaveAssignment}
            loading={saving}
            disabled={!isAssignmentDirty}
            className="flex-1"
          >
            {isAssignmentDirty ? 'Save Assignment' : 'No changes'}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  )
}
