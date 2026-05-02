// admin-frontend/components/species/SpeciesForm.tsx
'use client'

import { FormEvent, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { upsertSpecies } from '@/lib/api/admin'
import { POKEMON_TYPES } from '@/types'
import type { PokemonSpecies } from '@/types'

interface SpeciesFormProps {
  initial?: PokemonSpecies
  onSaved: (species: PokemonSpecies) => void
  onCancel: () => void
}

const typeOptions = [{ value: '', label: '— none —' }, ...POKEMON_TYPES.map((t) => ({ value: t, label: t }))]
const requiredTypeOptions = POKEMON_TYPES.map((t) => ({ value: t, label: t }))

export function SpeciesForm({ initial, onSaved, onCancel }: SpeciesFormProps) {
  const [id, setId] = useState(String(initial?.id ?? ''))
  const [name, setName] = useState(initial?.name ?? '')
  const [primaryType, setPrimaryType] = useState(initial?.primary_type ?? POKEMON_TYPES[0])
  const [secondaryType, setSecondaryType] = useState(initial?.secondary_type ?? '')
  const [hp, setHp] = useState(String(initial?.base_stats.hp ?? '45'))
  const [attack, setAttack] = useState(String(initial?.base_stats.attack ?? '49'))
  const [defense, setDefense] = useState(String(initial?.base_stats.defense ?? '49'))
  const [spAtk, setSpAtk] = useState(String(initial?.base_stats.special_attack ?? '65'))
  const [spDef, setSpDef] = useState(String(initial?.base_stats.special_defense ?? '65'))
  const [speed, setSpeed] = useState(String(initial?.base_stats.speed ?? '45'))
  const [captureRate, setCaptureRate] = useState(String(initial?.capture_rate ?? '45'))
  const [baseExp, setBaseExp] = useState(String(initial?.base_experience ?? '64'))
  const [isStarter, setIsStarter] = useState(initial?.is_starter ?? false)
  const [isRare, setIsRare] = useState(initial?.is_rare ?? false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const saved = await upsertSpecies({
        id: parseInt(id),
        name: name.trim(),
        primary_type: primaryType,
        secondary_type: secondaryType || null,
        base_stats: {
          hp: parseInt(hp),
          attack: parseInt(attack),
          defense: parseInt(defense),
          special_attack: parseInt(spAtk),
          special_defense: parseInt(spDef),
          speed: parseInt(speed),
        },
        capture_rate: parseInt(captureRate),
        base_experience: parseInt(baseExp),
        is_starter: isStarter,
        is_rare: isRare,
      })
      onSaved(saved)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <ErrorMessage message={error} />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Pokédex ID"
          type="number"
          min="1"
          value={id}
          onChange={(e) => setId(e.target.value)}
          required
          disabled={!!initial}
        />
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Bulbasaur"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Primary Type"
          value={primaryType}
          onChange={(e) => setPrimaryType(e.target.value)}
          options={requiredTypeOptions}
        />
        <Select
          label="Secondary Type"
          value={secondaryType}
          onChange={(e) => setSecondaryType(e.target.value)}
          options={typeOptions}
        />
      </div>

      <fieldset className="border border-surface-3 rounded p-3">
        <legend className="text-xs text-gray-400 px-1 uppercase tracking-wide">Base Stats</legend>
        <div className="grid grid-cols-3 gap-2 mt-1">
          <Input label="HP" type="number" min="1" value={hp} onChange={(e) => setHp(e.target.value)} required />
          <Input label="Attack" type="number" min="1" value={attack} onChange={(e) => setAttack(e.target.value)} required />
          <Input label="Defense" type="number" min="1" value={defense} onChange={(e) => setDefense(e.target.value)} required />
          <Input label="Sp. Atk" type="number" min="1" value={spAtk} onChange={(e) => setSpAtk(e.target.value)} required />
          <Input label="Sp. Def" type="number" min="1" value={spDef} onChange={(e) => setSpDef(e.target.value)} required />
          <Input label="Speed" type="number" min="1" value={speed} onChange={(e) => setSpeed(e.target.value)} required />
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Capture Rate (1–255)"
          type="number"
          min="1"
          max="255"
          value={captureRate}
          onChange={(e) => setCaptureRate(e.target.value)}
          required
        />
        <Input
          label="Base Experience"
          type="number"
          min="0"
          value={baseExp}
          onChange={(e) => setBaseExp(e.target.value)}
          required
        />
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={isStarter}
            onChange={(e) => setIsStarter(e.target.checked)}
            className="accent-pokered"
          />
          Starter
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={isRare}
            onChange={(e) => setIsRare(e.target.checked)}
            className="accent-pokered"
          />
          Rare (admin-spawn only)
        </label>
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={loading} className="flex-1">
          {initial ? 'Update Species' : 'Create Species'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
