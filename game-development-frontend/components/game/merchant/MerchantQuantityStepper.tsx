// game-development-frontend/components/game/merchant/MerchantQuantityStepper.tsx

'use client'

interface MerchantQuantityStepperProps {
  quantity: number
  onChange: (next: number) => void
  disabled?: boolean
}

export default function MerchantQuantityStepper({
  quantity,
  onChange,
  disabled = false,
}: MerchantQuantityStepperProps) {
  const dec = () => onChange(Math.max(0, quantity - 1))
  const inc = () => onChange(quantity + 1)

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={dec}
        disabled={disabled || quantity === 0}
        className="w-7 h-7 rounded-md bg-slate-700 text-slate-100 text-lg font-bold leading-none flex items-center justify-center hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="w-7 text-center font-mono text-sm text-slate-100">
        {quantity}
      </span>
      <button
        type="button"
        onClick={inc}
        disabled={disabled}
        className="w-7 h-7 rounded-md bg-yellow-500 text-slate-900 text-lg font-bold leading-none flex items-center justify-center hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  )
}
