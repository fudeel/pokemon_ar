// admin-frontend/components/ui/ErrorMessage.tsx

interface ErrorMessageProps {
  message: string | null
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null
  return (
    <div className="rounded bg-red-900/40 border border-red-700 px-3 py-2 text-sm text-red-300">
      {message}
    </div>
  )
}
