// game-development-frontend/app/game/page.tsx

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePlayer } from '@/context/PlayerContext'
import GameScreen from '@/components/game/GameScreen'
import LoadingScreen from '@/components/ui/LoadingScreen'

export default function GamePage() {
  const { session, isLoading } = usePlayer()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace('/')
    }
    if (!isLoading && session && !session.has_chosen_starter) {
      router.replace('/')
    }
  }, [session, isLoading, router])

  if (isLoading || !session) return <LoadingScreen message="Loading world…" />

  return <GameScreen />
}
