// admin-frontend/components/map/forms/NpcForm.tsx
'use client'

import { FormEvent, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { createNpc } from '@/lib/api/admin'
import { NPC_ROLES } from '@/types'
import type { Npc } from '@/types'

interface NpcFormProps {
  latitude: number
  longitude: number
  onCreated: (npc: Npc) => void
  onCancel: () => void
}

export function NpcForm({ latitude, longitude, onCreated, onCancel }: NpcFormProps) {
  const [name, setName] = useState('')
  const [role, setRole] = useState<string>(NPC_ROLES[0])
  const [dialogue, setDialogue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const npc = await createNpc({
        name: name.trim(),
        role,
        location: { latitude, longitude },
        dialogue: dialogue.trim() || null,
        metadata: null,
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
        onChange={(e) => setRole(e.target.value)}
        options={NPC_ROLES.map((r) => ({ value: r, label: r }))}
      />
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
