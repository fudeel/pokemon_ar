// admin-frontend/components/quests/QuestRewardEditor.tsx
'use client'

import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import type { Item } from '@/types'

export interface ItemRewardDraft {
  item_id: number
  quantity: number
}

interface Props {
  pokecoins: number
  experience: number
  itemRewards: ItemRewardDraft[]
  items: Item[]
  onPokecoinsChange: (value: number) => void
  onExperienceChange: (value: number) => void
  onItemRewardsChange: (next: ItemRewardDraft[]) => void
}

export function QuestRewardEditor({
  pokecoins,
  experience,
  itemRewards,
  items,
  onPokecoinsChange,
  onExperienceChange,
  onItemRewardsChange,
}: Props) {
  const unassigned = items.filter((i) => !itemRewards.some((r) => r.item_id === i.id))

  const addReward = (itemId: string) => {
    if (!itemId) return
    const id = parseInt(itemId, 10)
    if (itemRewards.some((r) => r.item_id === id)) return
    onItemRewardsChange([...itemRewards, { item_id: id, quantity: 1 }])
  }

  const updateQuantity = (itemId: number, raw: string) => {
    const quantity = Math.max(1, parseInt(raw, 10) || 1)
    onItemRewardsChange(
      itemRewards.map((r) => (r.item_id === itemId ? { ...r, quantity } : r)),
    )
  }

  const removeReward = (itemId: number) => {
    onItemRewardsChange(itemRewards.filter((r) => r.item_id !== itemId))
  }

  const itemNameById = new Map(items.map((i) => [i.id, i.name]))

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Pokécoins"
          type="number"
          min={0}
          value={String(pokecoins)}
          onChange={(e) => onPokecoinsChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
        />
        <Input
          label="Experience"
          type="number"
          min={0}
          value={String(experience)}
          onChange={(e) => onExperienceChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
        />
      </div>

      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
          Item Rewards ({itemRewards.length})
        </p>
        {itemRewards.length === 0 ? (
          <p className="text-sm text-gray-500 py-2">No item rewards.</p>
        ) : (
          <div className="border border-surface-3 rounded divide-y divide-surface-3">
            {itemRewards.map((r) => (
              <div key={r.item_id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <input
                  type="number"
                  min={1}
                  defaultValue={r.quantity}
                  onBlur={(e) => updateQuantity(r.item_id, e.target.value)}
                  className="w-16 rounded bg-surface-3 border border-surface-3 px-2 py-1 text-xs text-gray-100 text-center focus:outline-none focus:ring-1 focus:ring-pokered"
                />
                <span className="text-gray-100 font-medium flex-1">
                  {itemNameById.get(r.item_id) ?? `Item #${r.item_id}`}
                </span>
                <button
                  type="button"
                  onClick={() => removeReward(r.item_id)}
                  className="text-red-400 hover:text-red-300 text-xs"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        {unassigned.length > 0 ? (
          <div className="mt-2">
            <Select
              placeholder="— add item reward —"
              value=""
              onChange={(e) => addReward(e.target.value)}
              options={unassigned.map((i) => ({ value: String(i.id), label: i.name }))}
            />
          </div>
        ) : items.length === 0 ? (
          <p className="text-xs text-gray-500 mt-2">
            No items available. Create items first to grant them as rewards.
          </p>
        ) : null}
      </div>
    </div>
  )
}
