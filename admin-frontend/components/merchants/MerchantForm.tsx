// admin-frontend/components/merchants/MerchantForm.tsx
'use client'

import { FormEvent, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import {
  createMerchant,
  setMerchantItems,
  updateMerchant,
} from '@/lib/api/admin'
import type { Item, Merchant } from '@/types'

interface ItemEntry {
  item_id: number
  /** Empty string represents "no override" — use the item's buy_price. */
  price_override: number | ''
}

interface MerchantFormProps {
  items: Item[]
  initial?: Merchant
  onSaved: (merchant: Merchant) => void
  onCancel: () => void
}

export function MerchantForm({ items, initial, onSaved, onCancel }: MerchantFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [entries, setEntries] = useState<ItemEntry[]>(
    initial?.items.map((it) => ({
      item_id: it.item_id,
      price_override: it.price_override ?? '',
    })) ?? [],
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const itemsById = new Map(items.map((it) => [it.id, it]))
  const unusedItems = items.filter((it) => !entries.some((e) => e.item_id === it.id))

  const addEntry = () => {
    const first = unusedItems[0]
    if (!first) return
    setEntries((prev) => [...prev, { item_id: first.id, price_override: '' }])
  }

  const updateEntry = (
    index: number,
    field: keyof ItemEntry,
    value: number | '',
  ) => {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)))
  }

  const removeEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index))
  }

  const buildPayloadItems = () =>
    entries.map((e) => ({
      item_id: e.item_id,
      price_override: e.price_override === '' ? null : Number(e.price_override),
    }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    for (const entry of entries) {
      const item = itemsById.get(entry.item_id)
      if (!item) {
        setError('One or more selected items no longer exist.')
        return
      }
      if (entry.price_override === '' && item.buy_price === null) {
        setError(
          `${item.name} has no buy price; provide a price override or set a buy price on the item.`,
        )
        return
      }
    }

    setLoading(true)
    try {
      const trimmedName = name.trim()
      const trimmedDescription = description.trim() || null
      let merchant: Merchant
      if (initial) {
        merchant = await updateMerchant(initial.id, {
          name: trimmedName,
          description: trimmedDescription,
        })
        merchant = await setMerchantItems(initial.id, buildPayloadItems())
      } else {
        merchant = await createMerchant({
          name: trimmedName,
          description: trimmedDescription,
          items: buildPayloadItems(),
        })
      }
      onSaved(merchant)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-2">
        No items in the catalogue yet. Create items first via the Items page.
      </p>
    )
  }

  const itemOptions = items.map((it) => ({
    value: String(it.id),
    label: `${it.name} (${it.category}${it.buy_price !== null ? ` · ${it.buy_price}¢` : ' · no buy price'})`,
  }))

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <ErrorMessage message={error} />

      <Input
        label="Merchant Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Cerulean Pokémart"
        required
      />

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional flavour text"
          rows={2}
          className="rounded bg-surface-2 border border-surface-3 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-pokered"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Catalogue
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
            No items added yet. Click + Add to attach products.
          </p>
        )}

        {entries.map((entry, i) => {
          const item = itemsById.get(entry.item_id)
          const fallbackPrice = item?.buy_price ?? null
          return (
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
                  step="1"
                  title="Price override (leave blank to use item buy price)"
                  placeholder={fallbackPrice !== null ? String(fallbackPrice) : 'price'}
                  value={entry.price_override}
                  onChange={(e) =>
                    updateEntry(
                      i,
                      'price_override',
                      e.target.value === '' ? '' : parseInt(e.target.value),
                    )
                  }
                  className="w-20 rounded bg-surface-2 border border-surface-3 px-2 py-1.5 text-sm text-gray-100 text-right focus:outline-none focus:ring-1 focus:ring-pokered"
                />
                <span className="text-xs text-gray-400">¢</span>
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
          )
        })}
        <p className="text-[11px] text-gray-500">
          Leave the price field empty to use the item&apos;s buy price. Otherwise the override applies.
        </p>
      </div>

      <div className="flex gap-2">
        <Button type="submit" loading={loading} className="flex-1">
          {initial ? 'Save Changes' : 'Create Merchant'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
