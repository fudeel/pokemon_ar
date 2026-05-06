// admin-frontend/components/map/forms/NpcForm.tsx
'use client'

import { FormEvent, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { createNpc } from '@/lib/api/admin'
import { NPC_ROLES } from '@/types'
import type { Merchant, Npc } from '@/types'

interface NpcFormProps {
  latitude: number
  longitude: number
  merchants: Merchant[]
  onCreated: (npc: Npc) => void
  onCancel: () => void
}

export function NpcForm({ latitude, longitude, merchants, onCreated, onCancel }: NpcFormProps) {
  const [name, setName] = useState('')
  const [role, setRole] = useState<string>(NPC_ROLES[0])
  const [dialogue, setDialogue] = useState('')
  const [merchantId, setMerchantId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isMerchant = role === 'merchant'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (isMerchant && merchantId === '') {
      setError('Pick a merchant catalogue, or create one in the Merchants page first.')
      return
    }
    setLoading(true)
    try {
      const npc = await createNpc({
        name: name.trim(),
        role,
        location: { latitude, longitude },
        dialogue: dialogue.trim() || null,
        metadata: null,
        merchant_id: isMerchant ? Number(merchantId) : null,
      })
      onCreated(npc)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <ErrorMessage message={error} />
      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="NPC name"
        required
      />
      <Select
        label="Role"
        value={role}
        onChange={(e) => {
          setRole(e.target.value)
          if (e.target.value !== 'merchant') setMerchantId('')
        }}
        options={NPC_ROLES.map((r) => ({ value: r, label: r }))}
      />
      {isMerchant && (
        merchants.length === 0 ? (
          <p className="text-xs text-amber-400 bg-amber-900/20 border border-amber-800 rounded px-3 py-2">
            No merchant catalogues exist. Create one in the Merchants page first.
          </p>
        ) : (
          <Select
            label="Merchant catalogue"
            value={merchantId}
            onChange={(e) => setMerchantId(e.target.value)}
            options={[
              { value: '', label: '— select catalogue —' },
              ...merchants.map((m) => ({
                value: String(m.id),
                label: `${m.name} (${m.items.length} item${m.items.length === 1 ? '' : 's'})`,
              })),
            ]}
          />
        )
      )}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          Dialogue (optional)
        </label>
        <textarea
          value={dialogue}
          onChange={(e) => setDialogue(e.target.value)}
          rows={2}
          className="w-full rounded bg-surface-3 border border-surface-3 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pokered resize-none"
          placeholder="What will this NPC say?"
        />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
        <span>Lat: {latitude.toFixed(6)}</span>
        <span>Lng: {longitude.toFixed(6)}</span>
      </div>
      <div className="flex gap-2 mt-1">
        <Button type="submit" loading={loading} className="flex-1">Place</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
