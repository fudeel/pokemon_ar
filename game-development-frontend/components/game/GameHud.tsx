// game-development-frontend/components/game/GameHud.tsx

'use client'

import type { PlayerPosition, PlayerProfile } from '@/types'

interface GameHudProps {
  profile: PlayerProfile | null
  position: PlayerPosition
  isWorldLoading: boolean
  gpsUnavailable: boolean
}

export default function GameHud({
  profile,
  position,
  isWorldLoading,
  gpsUnavailable,
}: GameHudProps) {
  return (
    <>
      {/* Top-left player info */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur border border-slate-700 rounded-xl px-4 py-2">
          <p className="text-yellow-400 font-bold text-sm">
            {profile?.player.username ?? '…'}
          </p>
          <p className="text-slate-400 text-xs">
            Lv. {profile?.player.level ?? 1}
          </p>
        </div>
      </div>

      {/* Top-right location mode indicator */}
      <div className="absolute top-3 right-3 z-10 pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur border border-slate-700 rounded-xl px-3 py-2 flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              gpsUnavailable ? 'bg-yellow-400' : 'bg-green-400'
            }`}
          />
          <span className="text-slate-300 text-xs">
            {gpsUnavailable ? 'WASD' : 'GPS'}
          </span>
        </div>
      </div>

      {/* World loading indicator */}
      {isWorldLoading && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="bg-slate-900/80 backdrop-blur border border-slate-700 rounded-full px-4 py-1.5 flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-yellow-400 text-xs font-medium">Syncing world…</span>
          </div>
        </div>
      )}

      {/* Bottom WASD hint (keyboard mode only) */}
      {gpsUnavailable && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="bg-slate-900/70 backdrop-blur border border-slate-700 rounded-xl px-4 py-2 flex items-center gap-3">
            <KbdHint keys={['W', 'A', 'S', 'D']} />
            <span className="text-slate-400 text-xs">Move</span>
            <span className="text-slate-600 text-xs">or Arrow Keys</span>
          </div>
        </div>
      )}
    </>
  )
}

function KbdHint({ keys }: { keys: string[] }) {
  return (
    <div className="flex gap-1">
      {keys.map((k) => (
        <kbd
          key={k}
          className="bg-slate-700 border border-slate-600 rounded px-1.5 py-0.5 text-xs text-slate-300 font-mono"
        >
          {k}
        </kbd>
      ))}
    </div>
  )
}
