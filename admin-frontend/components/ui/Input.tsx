// admin-frontend/components/ui/Input.tsx
import { InputHTMLAttributes, forwardRef } from 'react'
import { classNames } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '_')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={classNames(
            'w-full rounded bg-surface-3 border px-3 py-2 text-sm text-gray-100 placeholder-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-pokered focus:border-transparent',
            error ? 'border-red-500' : 'border-surface-3',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'
