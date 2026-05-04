// admin-frontend/components/map/forms/EventAreaForm.tsx
'use client'

import { FormEvent, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { createEventArea } from '@/lib/api/admin'
import { fromLocalDatetimeInput } from '@/lib/utils'
import type { EventArea, GeoLocation } from '@/types'

interface EventAreaFormProps {
  polygon: GeoLocation[]
  onCreated: (area: EventArea) => void
  onCancel: () => void
}

export function EventAreaForm({ polygon, onCreated, onCancel }: EventAreaFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (polygon.length < 3) {
        throw new Error('Polygon needs at least 3 points')
      }
      const area = await createEventArea({
        name: name.trim(),
        description: description.trim() || null,
        polygon,
        starts_at: fromLocalDatetimeInput(startsAt),
        ends_at: fromLocalDatetimeInput(endsAt),
        metadata: null,
      })
      onCreated(area)
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
        label="Event Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Event name"
        required
      />
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded bg-surface-3 border border-surface-3 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pokered resize-none"
          placeholder="Event description"
        />
      </div>
      <Input
        label="Starts At"
        type="datetime-local"
        value={startsAt}
        onChange={(e) => setStartsAt(e.target.value)}
        required
      />
      <Input
        label="Ends At"
        type="datetime-local"
        value={endsAt}
        onChange={(e) => setEndsAt(e.target.value)}
        required
      />
      <div className="text-xs text-gray-400">
        Polygon: <span className="text-gray-200">{polygon.length} points</span>
      </div>
      <div className="flex gap-2 mt-1">
        <Button type="submit" loading={loading} className="flex-1">Place</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
