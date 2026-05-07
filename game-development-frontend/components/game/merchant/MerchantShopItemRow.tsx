// game-development-frontend/components/game/merchant/MerchantShopItemRow.tsx

'use client'

import type { MerchantItem } from '@/types'
import MerchantQuantityStepper from './MerchantQuantityStepper'

const CATEGORY_ICON: Record<string, string> = {
  pokeball: '🔴',
  potion: '🧪',
  revive: '⭐',
  key: '🗝',
  misc: '📦',
}

interface MerchantShopItemRowProps {
  item: MerchantItem
  quantity: number
  onChange: (next: number) => void
  disabled?: boolean
}

export default function MerchantShopItemRow({
  item,
  quantity,
  onChange,
  disabled = false,
}: MerchantShopItemRowProps) {
  const icon = CATEGORY_ICON[item.item_category] ?? '📦'
  const lineTotal = item.effective_price * quantity

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-800/70 border border-slate-700">
      <div className="w-9 h-9 rounded-md bg-slate-900 border border-slate-700 flex items-center justify-center text-lg shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-100 truncate">
          {item.item_name}
        </p>
        <p className="text-xs text-yellow-400 font-mono">
          ₽ {item.effective_price.toLocaleString()}
          {quantity > 0 && (
            <span className="ml-2 text-slate-400">
              · line {lineTotal.toLocaleString()}
            </span>
          )}
        </p>
      </div>
      <MerchantQuantityStepper
        quantity={quantity}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  )
}
