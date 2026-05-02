// game-development-frontend/components/ui/LoadingScreen.tsx

interface LoadingScreenProps {
  message?: string
}

export default function LoadingScreen({ message = 'Loading…' }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-900 z-50">
      <div className="w-16 h-16 rounded-full border-4 border-yellow-400 border-t-transparent animate-spin mb-6" />
      <p className="text-yellow-400 text-lg font-semibold tracking-wide">{message}</p>
    </div>
  )
}
