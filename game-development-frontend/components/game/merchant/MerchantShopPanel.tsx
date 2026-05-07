// game-development-frontend/components/game/merchant/MerchantShopPanel.tsx

'use client'

import { useEffect, useMemo, useState } from 'react'

import { ApiError } from '@/lib/api/client'
import { merchantApi } from '@/lib/api/merchant'
import { usePlayer } from '@/context/PlayerContext'
import type { Merchant, Npc, PlayerPosition, PurchaseReceipt } from '@/types'

import MerchantShopItemRow from './MerchantShopItemRow'

interface MerchantShopPanelProps {
  npc: Npc
  position: PlayerPosition
  onClose: () => void
}

export default function MerchantShopPanel({
  npc,
  position,
  onClose,
}: MerchantShopPanelProps) {
  const { profile, refreshProfile } = usePlayer()
  const pokecoins = profile?.player.pokecoins ?? 0

  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [receipt, setReceipt] = useState<PurchaseReceipt | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setLoadError(null)
    merchantApi
      .getShop(npc.id)
      .then((m) => {
        if (!cancelled) setMerchant(m)
      })
      .catch((e) => {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'Could not load shop.')
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [npc.id])

  const lines = useMemo(
    () =>
      Object.entries(quantities)
        .map(([id, qty]) => ({ item_id: Number(id), quantity: qty }))
        .filter((l) => l.quantity > 0),
    [quantities],
  )

  const total = useMemo(() => {
    if (!merchant) return 0
    return merchant.items.reduce((sum, item) => {
      const qty = quantities[item.item_id] ?? 0
      return sum + item.effective_price * qty
    }, 0)
  }, [merchant, quantities])

  const totalCount = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity, 0),
    [lines],
  )

  const insufficientFunds = total > pokecoins
  const canConfirm =
    !isSubmitting && lines.length > 0 && !insufficientFunds && !receipt

  const updateQuantity = (itemId: number, next: number) => {
    setQuantities((prev) => {
      if (next <= 0) {
        const { [itemId]: _drop, ...rest } = prev
        return rest
      }
      return { ...prev, [itemId]: next }
    })
  }

  const handleConfirm = async () => {
    if (!canConfirm) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const result = await merchantApi.purchase(
        npc.id,
        { latitude: position.latitude, longitude: position.longitude },
        lines,
      )
      setReceipt(result)
      setQuantities({})
      await refreshProfile()
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Purchase failed.'
      setSubmitError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full sm:max-w-md bg-slate-900 border-t sm:border border-slate-700 sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-sky-400 flex items-center justify-center text-lg shrink-0">
              🛍
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-100 truncate">
                {npc.name}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {merchant?.name ?? 'Shop'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                Pokécoins
              </p>
              <p className="text-yellow-400 font-mono font-bold text-sm">
                ₽ {pokecoins.toLocaleString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-lg leading-none"
              aria-label="Close shop"
            >
              ×
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {isLoading && (
            <p className="text-center text-slate-400 text-sm py-8">
              Loading catalogue…
            </p>
          )}

          {loadError && (
            <p className="text-center text-red-400 text-sm py-8">{loadError}</p>
          )}

          {!isLoading && !loadError && merchant && merchant.items.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-8">
              This merchant has nothing in stock right now.
            </p>
          )}

          {!isLoading &&
            !loadError &&
            merchant &&
            !receipt &&
            merchant.items.map((item) => (
              <MerchantShopItemRow
                key={item.item_id}
                item={item}
                quantity={quantities[item.item_id] ?? 0}
                onChange={(next) => updateQuantity(item.item_id, next)}
                disabled={isSubmitting}
              />
            ))}

          {receipt && (
            <div className="bg-emerald-950/50 border border-emerald-700 rounded-lg p-4 space-y-2">
              <p className="text-emerald-300 font-semibold text-sm flex items-center gap-2">
                <span>✓</span> Purchase complete
              </p>
              <ul className="text-xs text-emerald-100/80 space-y-1">
                {receipt.lines.map((l) => (
                  <li
                    key={l.item_id}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="truncate">
                      {l.item_name} × {l.quantity}
                    </span>
                    <span className="font-mono shrink-0">
                      ₽ {l.line_total.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between pt-2 border-t border-emerald-800 text-emerald-200 text-xs font-mono">
                <span>Paid</span>
                <span>₽ {receipt.total_cost.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-200 text-xs font-mono">
                <span>New balance</span>
                <span>₽ {receipt.pokecoins_after.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-800 px-4 py-3 space-y-2">
          {submitError && (
            <p className="text-xs text-red-400 text-center">{submitError}</p>
          )}

          {!receipt ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">
                  {totalCount === 0
                    ? 'Select items to buy'
                    : `${totalCount} item${totalCount === 1 ? '' : 's'}`}
                </span>
                <span
                  className={`font-mono font-bold ${
                    insufficientFunds ? 'text-red-400' : 'text-yellow-400'
                  }`}
                >
                  Total ₽ {total.toLocaleString()}
                </span>
              </div>
              {insufficientFunds && (
                <p className="text-xs text-red-400 text-right">
                  Not enough Pokécoins
                </p>
              )}
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!canConfirm}
                className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-900 font-bold py-2.5 rounded-lg text-sm transition-colors"
              >
                {isSubmitting ? 'Purchasing…' : 'Confirm purchase'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold py-2.5 rounded-lg text-sm"
            >
              Done
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}
