// admin-frontend/components/ui/Badge.tsx
import { classNames } from '@/lib/utils'
import { TYPE_COLORS } from '@/types'

interface BadgeProps {
  label: string
  color?: string
  className?: string
}

export function Badge({ label, color, className }: BadgeProps) {
  const bg = color ?? TYPE_COLORS[label.toLowerCase()] ?? '#6b7280'
  return (
    <span
      className={classNames(
        'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium text-white capitalize',
        className,
      )}
      style={{ backgroundColor: bg }}
    >
      {label}
    </span>
  )
}

export function TypeBadge({ type }: { type: string }) {
  return <Badge label={type} color={TYPE_COLORS[type.toLowerCase()]} />
}
