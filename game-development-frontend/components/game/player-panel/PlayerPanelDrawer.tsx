// game-development-frontend/components/game/player-panel/PlayerPanelDrawer.tsx

'use client'

import { useEffect } from 'react'

import type { PlayerProfile } from '@/types'

import BagView from './BagView'
import PokemonListView from './PokemonListView'
import WalletView from './WalletView'

export type PlayerPanelTab = 'pokemon' | 'bag' | 'wallet'

interface PlayerPanelDrawerProps {
  profile: PlayerProfile
  activeTab: PlayerPanelTab
  onChangeTab: (tab: PlayerPanelTab) => void
  onClose: () => void
}

const TABS: Array<{ id: PlayerPanelTab; label: string; icon: string }> = [
  { id: 'pokemon', label: 'Pokémon', icon: '🐾' },
  { id: 'bag', label: 'Bag', icon: '🎒' },
  { id: 'wallet', label: 'Coins', icon: '₽' },
]

export default function PlayerPanelDrawer({
  profile,
  activeTab,
  onChangeTab,
  onClose,
}: PlayerPanelDrawerProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-slate-900 border-t sm:border border-slate-700 sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div>
            <p className="text-sm font-bold text-slate-100">
              {profile.player.username}
            </p>
            <p className="text-xs text-slate-400">Lv. {profile.player.level}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-lg leading-none"
            aria-label="Close panel"
          >
            ×
          </button>
        </header>

        <nav className="flex border-b border-slate-800">
          {TABS.map((tab) => {
            const active = tab.id === activeTab
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeTab(tab.id)}
                className={`flex-1 py-2.5 text-xs font-semibold flex flex-col items-center gap-0.5 transition-colors border-b-2 ${
                  active
                    ? 'border-yellow-400 text-yellow-400 bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-base leading-none">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {activeTab === 'pokemon' && <PokemonListView pokemon={profile.pokemon} />}
          {activeTab === 'bag' && <BagView slots={profile.inventory} />}
          {activeTab === 'wallet' && (
            <WalletView pokecoins={profile.player.pokecoins} />
          )}
        </div>
      </div>
    </div>
  )
}
