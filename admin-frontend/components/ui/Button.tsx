// admin-frontend/components/ui/Button.tsx
import { ButtonHTMLAttributes } from 'react'
import { classNames } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-pokered hover:bg-pokered-dark text-white border-transparent',
  secondary: 'bg-surface-3 hover:bg-gray-600 text-gray-100 border-surface-3',
  danger: 'bg-red-800 hover:bg-red-700 text-white border-transparent',
  ghost: 'bg-transparent hover:bg-surface-3 text-gray-300 border-surface-3',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={classNames(
        'inline-flex items-center justify-center gap-2 rounded border font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-pokered focus:ring-offset-1 focus:ring-offset-surface',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
