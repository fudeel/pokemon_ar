// admin-frontend/components/map/forms/SpawnAreaForm.tsx
'use client'

import { FormEvent, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { createSpawnArea, setSpawnAreaPokemon } from '@/lib/api/admin'
import type { GeoLocation, PokemonSpecies, SpawnArea } from '@/types'

interface SpawnEntry {
  species_id: number
  spawn_chance: number
}

interface SpawnAreaFormProps {
  /** New-area mode: the polygon drawn on the map. */
  polygon?: GeoLocation[]
  species: PokemonSpecies[]
  /** When editing an existing area, pass it here — skips creating a new row */
  editing?: SpawnArea
  onSaved: (area: SpawnArea) => void
  onCancel: () => void
}

export function SpawnAreaForm({
  polygon,
  species,
  editing,
  onSaved,
  onCancel,
}: SpawnAreaFormProps) {
  const [name, setName] = useState(editing?.name ?? '')
  const [entries, setEntries] = useState<SpawnEntry[]>(
    editing?.pokemon.map((p) => ({ species_id: p.species_id, spawn_chance: p.spawn_chance })) ?? [],
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const unusedSpecies = species.filter((s) => !entries.some((e) => e.species_id === s.id))

  const addEntry = () => {
    const first = unusedSpecies[0]
    if (!first) return
    setEntries((prev) => [...prev, { species_id: first.id, spawn_chance: 50 }])
  }

  const updateEntry = (index: number, field: keyof SpawnEntry, value: number) => {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)))
  }

  const removeEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      let area: SpawnArea
      if (editing) {
        area = await setSpawnAreaPokemon(editing.id, entries)
      } else {
        if (!polygon || polygon.length < 3) {
          throw new Error('Polygon needs at least 3 points')
        }
        area = await createSpawnArea({
          name: name.trim(),
          polygon,
          pokemon: entries,
        })
      }
      onSaved(area)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  if (species.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-2">
        No species found. Add species first via the Pokémon Species page.
      </p>
    )
  }

  const speciesOptions = species.map((s) => ({ value: String(s.id), label: `#${s.id} ${s.name}` }))

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <ErrorMessage message={error} />

      {!editing && (
        <Input
          label="Area Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Fire Zone"
          required
        />
      )}

      {editing && (
        <div className="text-xs text-gray-400 bg-surface-3 rounded px-3 py-2">
          Editing <span className="text-gray-100 font-medium">{editing.name}</span>
          {' '}· {editing.polygon.length}-point zone
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Pokémon &amp; Spawn Chance
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addEntry}
            disabled={unusedSpecies.length === 0}
          >
            + Add
          </Button>
        </div>

        {entries.length === 0 && (
          <p className="text-xs text-gray-500 py-2 text-center">
            No Pokémon added yet. Click + Add to configure spawns.
          </p>
        )}

        {entries.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 bg-surface-3 rounded px-3 py-2">
            <div className="flex-1">
              <Select
                value={String(entry.species_id)}
                onChange={(e) => updateEntry(i, 'species_id', parseInt(e.target.value))}
                options={[
                  ...speciesOptions.filter(
                    (o) =>
                      o.value === String(entry.species_id) ||
                      !entries.some((e2, j) => j !== i && e2.species_id === parseInt(o.value)),
                  ),
                ]}
              />
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={entry.spawn_chance}
                onChange={(e) => updateEntry(i, 'spawn_chance', parseFloat(e.target.value))}
                className="w-16 rounded bg-surface-2 border border-surface-3 px-2 py-1.5 text-sm text-gray-100 text-right focus:outline-none focus:ring-1 focus:ring-pokered"
              />
              <span className="text-xs text-gray-400">%</span>
            </div>
            <button
              type="button"
              onClick={() => removeEntry(i)}
              className="text-gray-500 hover:text-red-400 transition-colors"
              aria-label="Remove"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {!editing && polygon && (
        <div className="text-xs text-gray-400">
          Polygon: <span className="text-gray-200">{polygon.length} points</span>
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" loading={loading} className="flex-1">
          {editing ? 'Save Changes' : 'Create Area'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
