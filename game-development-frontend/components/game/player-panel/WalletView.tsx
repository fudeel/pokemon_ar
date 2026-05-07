// game-development-frontend/components/game/player-panel/WalletView.tsx

'use client'

interface WalletViewProps {
  pokecoins: number
}

export default function WalletView({ pokecoins }: WalletViewProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-300 to-amber-600 border-4 border-yellow-200 flex items-center justify-center text-3xl shadow-lg">
        ₽
      </div>
      <p className="mt-4 text-[11px] uppercase tracking-wider text-slate-400">
        Pokécoins balance
      </p>
      <p className="mt-1 text-3xl font-bold text-yellow-400 font-mono">
        {pokecoins.toLocaleString()}
      </p>
      <p className="mt-3 text-xs text-slate-500 max-w-xs">
        Earn Pokécoins by completing quests, winning battles, and defending gyms.
      </p>
    </div>
  )
}
