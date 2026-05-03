// admin-frontend/components/moves/MoveForm.tsx
'use client'

import { useState, type FormEvent } from 'react'
import { upsertMove } from '@/lib/api/admin'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { POKEMON_TYPES, type Move } from '@/types'

const CATEGORY_OPTIONS = [
  { value: 'physical', label: 'Physical' },
  { value: 'special', label: 'Special' },
  { value: 'status', label: 'Status' },
]

const TYPE_OPTIONS = POKEMON_TYPES.map((t) => ({
  value: t,
  label: t.charAt(0).toUpperCase() + t.slice(1),
}))

interface MoveFormProps {
  initial?: Move
  onSaved: (move: Move) => void
  onCancel: () => void
}

export function MoveForm({ initial, onSaved, onCancel }: MoveFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [type, setType] = useState(initial?.type ?? 'normal')
  const [category, setCategory] = useState<string>(initial?.category ?? 'physical')
  const [power, setPower] = useState(initial?.power != null ? String(initial.power) : '')
  const [accuracy, setAccuracy] = useState(initial?.accuracy != null ? String(initial.accuracy) : '')
  const [pp, setPp] = useState(initial?.pp != null ? String(initial.pp) : '20')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const move = await upsertMove({
        name: name.trim(),
        type,
        category,
        power: power !== '' ? parseInt(power, 10) : null,
        accuracy: accuracy !== '' ? parseInt(accuracy, 10) : null,
        pp: parseInt(pp, 10),
      })
      onSaved(move)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save move.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {error && <ErrorMessage message={error} />}
      <Input
        label="Move Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Tackle"
        required
        disabled={!!initial}
      />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Type" value={type} onChange={(e) => setType(e.target.value)} options={TYPE_OPTIONS} />
        <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)} options={CATEGORY_OPTIONS} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Input label="Power" type="number" min={1} max={250} value={power} onChange={(e) => setPower(e.target.value)} placeholder="—" />
        <Input label="Accuracy" type="number" min={1} max={100} value={accuracy} onChange={(e) => setAccuracy(e.target.value)} placeholder="—" />
        <Input label="PP" type="number" min={1} max={40} value={pp} onChange={(e) => setPp(e.target.value)} required />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={saving} disabled={!name.trim()}>
          {initial ? 'Save Move' : 'Create Move'}
        </Button>
      </div>
    </form>
  )
}
