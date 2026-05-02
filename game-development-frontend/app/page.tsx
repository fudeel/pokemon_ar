// game-development-frontend/app/page.tsx

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePlayer } from '@/context/PlayerContext'
import NameEntryForm from '@/components/entry/NameEntryForm'
import StarterSelection from '@/components/entry/StarterSelection'
import LoadingScreen from '@/components/ui/LoadingScreen'

export default function EntryPage() {
  const { session, isLoading, error, login, updateSession } = usePlayer()
  const router = useRouter()

  useEffect(() => {
    if (session?.has_chosen_starter) {
      router.replace('/game')
    }
  }, [session?.has_chosen_starter, router])

  if (isLoading) return <LoadingScreen message="Entering the world…" />

  // No session yet: show name entry
  if (!session) {
    return (
      <NameEntryForm isLoading={isLoading} error={error} onSubmit={login} />
    )
  }

  // Session exists but no starter: show starter selection
  if (!session.has_chosen_starter) {
    return (
      <StarterSelection
        onStarterChosen={() => {
          updateSession({ has_chosen_starter: true })
          router.replace('/game')
        }}
      />
    )
  }

  // Redirect handled by useEffect
  return <LoadingScreen message="Loading world…" />
}
