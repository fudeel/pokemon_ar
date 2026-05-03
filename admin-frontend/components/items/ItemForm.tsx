// admin-frontend/components/items/ItemForm.tsx
'use client'

import { useState, type FormEvent } from 'react'
import { createItem, updateItem } from '@/lib/api/admin'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { ITEM_CATEGORIES, type Item } from '@/types'

const CATEGORY_OPTIONS = ITEM_CATEGORIES.map((c) => ({
  value: c,
  label: c.charAt(0).toUpperCase() + c.slice(1),
}))

interface ItemFormProps {
  initial?: Item
  onSaved: (item: Item) => void
  onCancel: () => void
}

export function ItemForm({ initial, onSaved, onCancel }: ItemFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState<string>(initial?.category ?? 'misc')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [buyPrice, setBuyPrice] = useState(initial?.buy_price != null ? String(initial.buy_price) : '')
  const [sellPrice, setSellPrice] = useState(initial?.sell_price != null ? String(initial.sell_price) : '')
  const [effectValue, setEffectValue] = useState(
    initial?.effect_value != null ? String(initial.effect_value) : '',
  )
  const [stackable, setStackable] = useState(initial?.stackable ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !description.trim()) return
    setSaving(true)
    setError(null)
    try {
      const payload = {
        name: name.trim(),
        category,
        description: description.trim(),
        buy_price: buyPrice !== '' ? parseInt(buyPrice, 10) : null,
        sell_price: sellPrice !== '' ? parseInt(sellPrice, 10) : null,
        effect_value: effectValue !== '' ? parseInt(effectValue, 10) : null,
        stackable,
      }
      const result = initial ? await updateItem(initial.id, payload) : await createItem(payload)
      onSaved(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      {error && <ErrorMessage message={error} />}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Item Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Great Ball"
          required
        />
        <Select
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={CATEGORY_OPTIONS}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          required
          className="w-full rounded bg-surface-3 border border-surface-3 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pokered"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Buy Price"
          type="number"
          min={0}
          value={buyPrice}
          onChange={(e) => setBuyPrice(e.target.value)}
          placeholder="—"
        />
        <Input
          label="Sell Price"
          type="number"
          min={0}
          value={sellPrice}
          onChange={(e) => setSellPrice(e.target.value)}
          placeholder="—"
        />
        <Input
          label="Effect Value"
          type="number"
          value={effectValue}
          onChange={(e) => setEffectValue(e.target.value)}
          placeholder="—"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-300">
        <input
          type="checkbox"
          checked={stackable}
          onChange={(e) => setStackable(e.target.checked)}
          className="accent-pokered"
        />
        Stackable in inventory
      </label>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={saving} disabled={!name.trim() || !description.trim()}>
          {initial ? 'Save Item' : 'Create Item'}
        </Button>
      </div>
    </form>
  )
}
