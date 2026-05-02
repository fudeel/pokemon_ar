// admin-frontend/components/map/forms/RarePokemonForm.tsx
'use client'

import { FormEvent, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { createRarePokemon } from '@/lib/api/admin'
import { fromLocalDatetimeInput } from '@/lib/utils'
import type { PokemonSpecies, RareWildPokemon } from '@/types'

interface RarePokemonFormProps {
  latitude: number
  longitude: number
  species: PokemonSpecies[]
  onCreated: (pokemon: RareWildPokemon) => void
  onCancel: () => void
}

export function RarePokemonForm({ latitude, longitude, species, onCreated, onCancel }: RarePokemonFormProps) {
  const [speciesId, setSpeciesId] = useState(species[0]?.id?.toString() ?? '')
  const [level, setLevel] = useState('30')
  const [expiresAt, setExpiresAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const speciesOptions = species.map((s) => ({
    value: String(s.id),
    label: `#${s.id} ${s.name}`,
  }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const pokemon = await createRarePokemon({
        species_id: parseInt(speciesId),
        level: parseInt(level),
        location: { latitude, longitude },
        expires_at: expiresAt ? fromLocalDatetimeInput(expiresAt) : null,
      })
      onCreated(pokemon)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to spawn')
    } finally {
      setLoading(false)
    }
  }

  if (species.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        No species found. Add species first via the Pokémon Species page.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <ErrorMessage message={error} />
      <Select
        label="Species"
        value={speciesId}
        onChange={(e) => setSpeciesId(e.target.value)}
        options={speciesOptions}
      />
      <Input
        label="Level"
        type="number"
        min="1"
        max="100"
        value={level}
        onChange={(e) => setLevel(e.target.value)}
        required
      />
      <Input
        label="Expires At (optional)"
        type="datetime-local"
        value={expiresAt}
        onChange={(e) => setExpiresAt(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
        <span>Lat: {latitude.toFixed(6)}</span>
        <span>Lng: {longitude.toFixed(6)}</span>
      </div>
      <div className="flex gap-2 mt-1">
        <Button type="submit" loading={loading} className="flex-1">Spawn</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
