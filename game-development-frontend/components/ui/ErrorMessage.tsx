// game-development-frontend/components/ui/ErrorMessage.tsx

interface ErrorMessageProps {
  message: string
  onDismiss?: () => void
}

export default function ErrorMessage({ message, onDismiss }: ErrorMessageProps) {
  return (
    <div className="flex items-start gap-3 bg-red-900/80 border border-red-500 rounded-lg px-4 py-3 text-red-100">
      <span className="text-red-400 text-lg leading-none mt-0.5">✕</span>
      <p className="flex-1 text-sm">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-200 text-xs underline shrink-0"
        >
          Dismiss
        </button>
      )}
    </div>
  )
}
