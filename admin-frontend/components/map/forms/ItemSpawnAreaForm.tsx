// admin-frontend/components/map/forms/ItemSpawnAreaForm.tsx
'use client'

import { FormEvent, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { createItemSpawnArea, setItemSpawnAreaItems } from '@/lib/api/admin'
import type { GeoLocation, Item, ItemSpawnArea } from '@/types'

interface ItemEntry {
  item_id: number
  spawn_chance: number
  max_quantity: number
}

interface ItemSpawnAreaFormProps {
  /** New-area mode: the polygon drawn on the map. */
  polygon?: GeoLocation[]
  items: Item[]
  /** When editing an existing area, pass it here — skips creating a new row */
  editing?: ItemSpawnArea
  onSaved: (area: ItemSpawnArea) => void
  onCancel: () => void
}

export function ItemSpawnAreaForm({
  polygon,
  items,
  editing,
  onSaved,
  onCancel,
}: ItemSpawnAreaFormProps) {
  const [name, setName] = useState(editing?.name ?? '')
  const [entries, setEntries] = useState<ItemEntry[]>(
    editing?.items.map((i) => ({
      item_id: i.item_id,
      spawn_chance: i.spawn_chance,
      max_quantity: i.max_quantity,
    })) ?? [],
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const unusedItems = items.filter((item) => !entries.some((e) => e.item_id === item.id))

  const addEntry = () => {
    const first = unusedItems[0]
    if (!first) return
    setEntries((prev) => [...prev, { item_id: first.id, spawn_chance: 50, max_quantity: 1 }])
  }

  const updateEntry = (index: number, field: keyof ItemEntry, value: number) => {
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
      let area: ItemSpawnArea
      if (editing) {
        area = await setItemSpawnAreaItems(editing.id, entries)
      } else {
        if (!polygon || polygon.length < 3) {
          throw new Error('Polygon needs at least 3 points')
        }
        area = await createItemSpawnArea({
          name: name.trim(),
          polygon,
          items: entries,
        })
      }
      onSaved(area)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-2">
        No items found. Create items first via the Items page.
      </p>
    )
  }

  const itemOptions = items.map((item) => ({
    value: String(item.id),
    label: `${item.name} (${item.category})`,
  }))

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <ErrorMessage message={error} />

      {!editing && (
        <Input
          label="Area Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Potion Grove"
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
            Items &amp; Spawn Chance
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addEntry}
            disabled={unusedItems.length === 0}
          >
            + Add
          </Button>
        </div>

        {entries.length === 0 && (
          <p className="text-xs text-gray-500 py-2 text-center">
            No items added yet. Click + Add to configure spawns.
          </p>
        )}

        {entries.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 bg-surface-3 rounded px-3 py-2">
            <div className="flex-1 min-w-0">
              <Select
                value={String(entry.item_id)}
                onChange={(e) => updateEntry(i, 'item_id', parseInt(e.target.value))}
                options={[
                  ...itemOptions.filter(
                    (o) =>
                      o.value === String(entry.item_id) ||
                      !entries.some((e2, j) => j !== i && e2.item_id === parseInt(o.value)),
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
                title="Spawn chance %"
                value={entry.spawn_chance}
                onChange={(e) => updateEntry(i, 'spawn_chance', parseFloat(e.target.value))}
                className="w-14 rounded bg-surface-2 border border-surface-3 px-2 py-1.5 text-sm text-gray-100 text-right focus:outline-none focus:ring-1 focus:ring-pokered"
              />
              <span className="text-xs text-gray-400">%</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <input
                type="number"
                min="1"
                step="1"
                title="Max quantity"
                value={entry.max_quantity}
                onChange={(e) => updateEntry(i, 'max_quantity', parseInt(e.target.value))}
                className="w-12 rounded bg-surface-2 border border-surface-3 px-2 py-1.5 text-sm text-gray-100 text-right focus:outline-none focus:ring-1 focus:ring-pokered"
              />
              <span className="text-xs text-gray-400">qty</span>
            </div>
            <button
              type="button"
              onClick={() => removeEntry(i)}
              className="text-gray-500 hover:text-red-400 transition-colors shrink-0"
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
