// admin-frontend/components/items/ItemForm.tsx
'use client'

import { useState, type FormEvent } from 'react'
import { createItem, updateItem } from '@/lib/api/admin'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import {
  ITEM_CATEGORIES,
  ITEM_EFFECT_OPERATIONS,
  NERF_KEYS,
  type Item,
  type ItemEffect,
  type ItemEffectOperation,
  type ItemEffectValue,
} from '@/types'

const CATEGORY_OPTIONS = ITEM_CATEGORIES.map((c) => ({
  value: c,
  label: c.charAt(0).toUpperCase() + c.slice(1),
}))

const TARGET_OPTIONS = [
  { value: 'pokemon', label: 'Pokemon' },
  { value: 'player', label: 'Player' },
]

const ATTRIBUTE_SUGGESTIONS = [
  'hp',
  'current_hp',
  'experience',
  ...NERF_KEYS.map((k) => `nerfs.${k}`),
]

const OPERATION_OPTIONS = ITEM_EFFECT_OPERATIONS.map((op) => ({
  value: op,
  label: op === 'set' ? 'Set (replace)' : 'Delta (add to current)',
}))

const VALUE_TYPES = [
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'null', label: 'None / null' },
  { value: 'string', label: 'String' },
] as const
type ValueType = typeof VALUE_TYPES[number]['value']

function inferValueType(v: ItemEffectValue): ValueType {
  if (v === null) return 'null'
  if (typeof v === 'boolean') return 'boolean'
  if (typeof v === 'number') return 'number'
  return 'string'
}

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
  const [stackable, setStackable] = useState(initial?.stackable ?? true)

  const [hasEffect, setHasEffect] = useState<boolean>(initial?.effect != null)
  const [effectTarget, setEffectTarget] = useState(initial?.effect?.target ?? 'pokemon')
  const [effectAttribute, setEffectAttribute] = useState(initial?.effect?.attribute ?? 'hp')
  const [effectOperation, setEffectOperation] = useState<ItemEffectOperation>(
    initial?.effect?.operation ?? 'delta',
  )
  const [valueType, setValueType] = useState<ValueType>(
    initial?.effect ? inferValueType(initial.effect.value) : 'number',
  )
  const [valueText, setValueText] = useState<string>(() => {
    const v = initial?.effect?.value
    if (v === null || v === undefined) return ''
    return String(v)
  })
  const [valueBool, setValueBool] = useState<boolean>(
    typeof initial?.effect?.value === 'boolean' ? initial!.effect!.value as boolean : false,
  )

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const buildEffect = (): ItemEffect | null => {
    if (!hasEffect) return null
    let value: ItemEffectValue
    switch (valueType) {
      case 'number': {
        const n = parseFloat(valueText)
        if (Number.isNaN(n)) throw new Error('Effect numeric value is invalid.')
        value = n
        break
      }
      case 'boolean':
        value = valueBool
        break
      case 'null':
        value = null
        break
      case 'string':
        value = valueText
        break
    }
    if (!effectTarget.trim() || !effectAttribute.trim()) {
      throw new Error('Effect target and attribute are required.')
    }
    return {
      target: effectTarget.trim(),
      attribute: effectAttribute.trim(),
      operation: effectOperation,
      value,
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !description.trim()) return
    setSaving(true)
    setError(null)
    try {
      const effect = buildEffect()
      const payload = {
        name: name.trim(),
        category,
        description: description.trim(),
        buy_price: buyPrice !== '' ? parseInt(buyPrice, 10) : null,
        sell_price: sellPrice !== '' ? parseInt(sellPrice, 10) : null,
        effect,
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

      <div className="grid grid-cols-2 gap-3">
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

      <div className="rounded border border-surface-3 p-3 flex flex-col gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-200 font-medium">
          <input
            type="checkbox"
            checked={hasEffect}
            onChange={(e) => setHasEffect(e.target.checked)}
            className="accent-pokered"
          />
          Item has an effect (leave off for junk / collectables)
        </label>

        {hasEffect && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Target"
                value={effectTarget}
                onChange={(e) => setEffectTarget(e.target.value)}
                options={TARGET_OPTIONS}
              />
              <Select
                label="Operation"
                value={effectOperation}
                onChange={(e) => setEffectOperation(e.target.value as ItemEffectOperation)}
                options={OPERATION_OPTIONS}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Attribute (dotted path, e.g. <code>hp</code> or <code>nerfs.venom_poison</code>)
              </label>
              <input
                list="effect-attribute-suggestions"
                value={effectAttribute}
                onChange={(e) => setEffectAttribute(e.target.value)}
                placeholder="hp"
                className="w-full rounded bg-surface-3 border border-surface-3 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-pokered"
                required
              />
              <datalist id="effect-attribute-suggestions">
                {ATTRIBUTE_SUGGESTIONS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-3 items-end">
              <Select
                label="Value Type"
                value={valueType}
                onChange={(e) => setValueType(e.target.value as ValueType)}
                options={VALUE_TYPES.map((v) => ({ value: v.value, label: v.label }))}
              />
              {valueType === 'boolean' ? (
                <label className="flex items-center gap-2 text-sm text-gray-300 pb-2">
                  <input
                    type="checkbox"
                    checked={valueBool}
                    onChange={(e) => setValueBool(e.target.checked)}
                    className="accent-pokered"
                  />
                  Value: {valueBool ? 'true' : 'false'}
                </label>
              ) : valueType === 'null' ? (
                <div className="text-xs text-gray-500 pb-2">Value will be sent as null.</div>
              ) : (
                <Input
                  label="Value"
                  type={valueType === 'number' ? 'number' : 'text'}
                  value={valueText}
                  onChange={(e) => setValueText(e.target.value)}
                  placeholder={valueType === 'number' ? '20' : 'text'}
                />
              )}
            </div>

            <p className="text-xs text-gray-500">
              Example: Potion → target <code>pokemon</code>, attribute <code>hp</code>, operation
              <code> delta</code>, value <code>20</code>. Antidote → attribute
              <code> nerfs.venom_poison</code>, operation <code>set</code>, value <code>false</code>.
            </p>
          </>
        )}
      </div>

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
