// game-development-frontend/components/entry/StarterSelection.tsx

'use client'

import { useEffect, useState } from 'react'
import { playerApi } from '@/lib/api/player'
import { usePlayer } from '@/context/PlayerContext'
import StarterCard from './StarterCard'
import LoadingScreen from '@/components/ui/LoadingScreen'
import ErrorMessage from '@/components/ui/ErrorMessage'
import type { PokemonSpecies } from '@/types'

interface StarterSelectionProps {
  onStarterChosen: () => void
}

export default function StarterSelection({ onStarterChosen }: StarterSelectionProps) {
  const { updateSession, refreshProfile } = usePlayer()

  const [starters, setStarters] = useState<PokemonSpecies[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [isLoadingStarters, setIsLoadingStarters] = useState(true)
  const [isConfirming, setIsConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    playerApi
      .listStarters()
      .then(setStarters)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load starters.'))
      .finally(() => setIsLoadingStarters(false))
  }, [])

  const confirm = async () => {
    if (selectedId === null) return
    setIsConfirming(true)
    setError(null)
    try {
      await playerApi.chooseStarter(selectedId)
      updateSession({ has_chosen_starter: true })
      await refreshProfile()
      onStarterChosen()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not choose starter. Try again.')
    } finally {
      setIsConfirming(false)
    }
  }

  if (isLoadingStarters) return <LoadingScreen message="Preparing your starters…" />

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center overflow-y-auto py-8 px-4">
      <h2 className="text-yellow-400 text-2xl font-bold uppercase tracking-widest mb-1">
        Choose Your Starter
      </h2>
      <p className="text-slate-400 text-sm mb-8">Your first partner on this journey</p>

      {error && (
        <div className="w-full max-w-md mb-4">
          <ErrorMessage message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-md">
        {starters.map((s) => (
          <StarterCard
            key={s.id}
            species={s}
            isSelected={selectedId === s.id}
            onSelect={() => setSelectedId(s.id)}
          />
        ))}
      </div>

      <button
        onClick={confirm}
        disabled={selectedId === null || isConfirming}
        className="mt-8 bg-yellow-400 hover:bg-yellow-300 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 font-bold rounded-xl px-10 py-4 text-lg transition-colors"
      >
        {isConfirming ? 'Choosing…' : 'Choose Pokémon!'}
      </button>
    </div>
  )
}
