// admin-frontend/components/layout/Header.tsx

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-surface-3 bg-surface-2 shrink-0">
      <div>
        <h1 className="text-base font-semibold text-gray-100">{title}</h1>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
