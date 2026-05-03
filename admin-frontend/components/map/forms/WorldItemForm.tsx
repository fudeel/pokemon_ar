// admin-frontend/components/map/forms/WorldItemForm.tsx
'use client'

import { FormEvent, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { placeWorldItem } from '@/lib/api/admin'
import { fromLocalDatetimeInput } from '@/lib/utils'
import type { Item, WorldItemSpawn } from '@/types'

interface WorldItemFormProps {
  latitude: number
  longitude: number
  items: Item[]
  onCreated: (spawn: WorldItemSpawn) => void
  onCancel: () => void
}

export function WorldItemForm({ latitude, longitude, items, onCreated, onCancel }: WorldItemFormProps) {
  const [itemId, setItemId] = useState(items[0]?.id?.toString() ?? '')
  const [quantity, setQuantity] = useState('1')
  const [isHidden, setIsHidden] = useState(false)
  const [expiresAt, setExpiresAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const itemOptions = items.map((item) => ({
    value: String(item.id),
    label: `${item.name} (${item.category})`,
  }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const spawn = await placeWorldItem({
        item_id: parseInt(itemId),
        quantity: parseInt(quantity),
        location: { latitude, longitude },
        is_hidden: isHidden,
        expires_at: expiresAt ? fromLocalDatetimeInput(expiresAt) : null,
      })
      onCreated(spawn)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to place item')
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <ErrorMessage message={error} />
      <Select
        label="Item"
        value={itemId}
        onChange={(e) => setItemId(e.target.value)}
        options={itemOptions}
      />
      <Input
        label="Quantity"
        type="number"
        min="1"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        required
      />

      {/* Hidden / visible toggle */}
      <label className="flex items-start gap-3 cursor-pointer select-none">
        <div className="relative mt-0.5 shrink-0">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={isHidden}
            onChange={(e) => setIsHidden(e.target.checked)}
          />
          <div className="w-9 h-5 rounded-full bg-surface-3 peer-checked:bg-pokered transition-colors" />
          <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-200">
            {isHidden ? 'Hidden (mystery item)' : 'Visible (item shown)'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {isHidden
              ? 'Players see a mystery box on the map. Identity revealed only on collection.'
              : 'Players can see the item name and category before collecting.'}
          </p>
        </div>
      </label>

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
        <Button type="submit" loading={loading} className="flex-1">Place Item</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
