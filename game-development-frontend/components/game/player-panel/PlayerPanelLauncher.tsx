// game-development-frontend/components/game/player-panel/PlayerPanelLauncher.tsx

'use client'

import { useState } from 'react'

import type { PlayerProfile } from '@/types'

import PlayerPanelDrawer, { type PlayerPanelTab } from './PlayerPanelDrawer'

interface PlayerPanelLauncherProps {
  profile: PlayerProfile
}

interface LauncherButtonProps {
  icon: string
  label: string
  value: string | number
  onClick: () => void
  accent: 'sky' | 'emerald' | 'yellow'
}

const ACCENT_CLASSES: Record<LauncherButtonProps['accent'], string> = {
  sky: 'border-sky-500/50 hover:border-sky-400 text-sky-300',
  emerald: 'border-emerald-500/50 hover:border-emerald-400 text-emerald-300',
  yellow: 'border-yellow-500/50 hover:border-yellow-400 text-yellow-300',
}

function LauncherButton({
  icon,
  label,
  value,
  onClick,
  accent,
}: LauncherButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/85 backdrop-blur border ${ACCENT_CLASSES[accent]} transition-colors pointer-events-auto`}
    >
      <span className="text-lg leading-none">{icon}</span>
      <div className="text-left min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-slate-400 leading-tight">
          {label}
        </p>
        <p className="text-sm font-bold font-mono leading-tight truncate">
          {value}
        </p>
      </div>
    </button>
  )
}

export default function PlayerPanelLauncher({
  profile,
}: PlayerPanelLauncherProps) {
  const [openTab, setOpenTab] = useState<PlayerPanelTab | null>(null)

  const itemCount = profile.inventory.reduce((sum, s) => sum + s.quantity, 0)

  return (
    <>
      <div className="absolute bottom-3 left-3 right-3 z-[800] flex gap-2 pointer-events-none">
        <LauncherButton
          icon="🐾"
          label="Pokémon"
          value={profile.pokemon.length}
          accent="sky"
          onClick={() => setOpenTab('pokemon')}
        />
        <LauncherButton
          icon="🎒"
          label="Bag"
          value={itemCount}
          accent="emerald"
          onClick={() => setOpenTab('bag')}
        />
        <LauncherButton
          icon="₽"
          label="Pokécoins"
          value={profile.player.pokecoins.toLocaleString()}
          accent="yellow"
          onClick={() => setOpenTab('wallet')}
        />
      </div>

      {openTab && (
        <PlayerPanelDrawer
          profile={profile}
          activeTab={openTab}
          onChangeTab={setOpenTab}
          onClose={() => setOpenTab(null)}
        />
      )}
    </>
  )
}
