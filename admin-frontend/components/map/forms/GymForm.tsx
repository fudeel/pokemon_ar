// admin-frontend/components/map/forms/GymForm.tsx
'use client'

import { FormEvent, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { createGym } from '@/lib/api/admin'
import type { Gym } from '@/types'

interface GymFormProps {
  latitude: number
  longitude: number
  onCreated: (gym: Gym) => void
  onCancel: () => void
}

export function GymForm({ latitude, longitude, onCreated, onCancel }: GymFormProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const gym = await createGym({
        name: name.trim(),
        location: { latitude, longitude },
      })
      onCreated(gym)
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
        label="Gym Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Gym name"
        required
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
