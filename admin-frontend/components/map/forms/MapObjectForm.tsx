// admin-frontend/components/map/forms/MapObjectForm.tsx
'use client'

import { FormEvent, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { createMapObject } from '@/lib/api/admin'
import { MAP_OBJECT_KINDS } from '@/types'
import type { MapObject } from '@/types'

interface MapObjectFormProps {
  latitude: number
  longitude: number
  onCreated: (obj: MapObject) => void
  onCancel: () => void
}

export function MapObjectForm({ latitude, longitude, onCreated, onCancel }: MapObjectFormProps) {
  const [kind, setKind] = useState<string>(MAP_OBJECT_KINDS[0])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const obj = await createMapObject({
        kind,
        name: name.trim() || null,
        location: { latitude, longitude },
        metadata: null,
      })
      onCreated(obj)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <ErrorMessage message={error} />
      <Select
        label="Kind"
        value={kind}
        onChange={(e) => setKind(e.target.value)}
        options={MAP_OBJECT_KINDS.map((k) => ({ value: k, label: k.replace('_', ' ') }))}
      />
      <Input
        label="Name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Custom name"
      />
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
