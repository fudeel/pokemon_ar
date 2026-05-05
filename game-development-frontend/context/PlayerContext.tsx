// game-development-frontend/context/PlayerContext.tsx

'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { ApiError, apiClient } from '@/lib/api/client'
import { authApi } from '@/lib/api/auth'
import {
  loadActivePlayerSession,
  loadPlayerSession,
  persistPlayerSession,
} from '@/lib/playerSessionStorage'
import type { PlayerProfile, PlayerSession } from '@/types'

interface PlayerContextValue {
  session: PlayerSession | null
  profile: PlayerProfile | null
  isLoading: boolean
  error: string | null
  login: (username: string) => Promise<void>
  updateSession: (patch: Partial<PlayerSession>) => void
  refreshProfile: () => Promise<void>
}

const PlayerContext = createContext<PlayerContextValue | null>(null)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PlayerSession | null>(null)
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshProfile = useCallback(async () => {
    try {
      const p = await apiClient.get<PlayerProfile>('/me/profile')
      setProfile(p)
    } catch {
      // profile fetch failure is non-fatal
    }
  }, [])

  const updateSession = useCallback((patch: Partial<PlayerSession>) => {
    setSession((prev) => {
      if (!prev) return prev
      const updated = { ...prev, ...patch }
      persistPlayerSession(updated)
      return updated
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    const stored = loadActivePlayerSession()
    if (!stored) {
      setIsLoading(false)
      return () => {
        cancelled = true
      }
    }
    const sessionToRestore = stored

    async function restoreSession() {
      try {
        const res = await authApi.login(
          sessionToRestore.username,
          sessionToRestore.password,
        )
        const refreshed: PlayerSession = {
          ...sessionToRestore,
          token: res.token,
          expires_at: res.expires_at,
          has_chosen_starter: res.has_chosen_starter,
          chosen_starter: res.has_chosen_starter
            ? sessionToRestore.chosen_starter ?? null
            : null,
        }
        persistPlayerSession(refreshed)
        if (!cancelled) setSession(refreshed)
      } catch {
        if (!cancelled) setSession(sessionToRestore)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    restoreSession()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (username: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const stored = loadPlayerSession(username)

      if (stored) {
        // Re-authenticate with stored credentials to get a fresh token
        try {
          const res = await authApi.login(stored.username, stored.password)
          const refreshed: PlayerSession = {
            ...stored,
            token: res.token,
            expires_at: res.expires_at,
            has_chosen_starter: res.has_chosen_starter,
            chosen_starter: stored.chosen_starter ?? null,
          }
          persistPlayerSession(refreshed)
          setSession(refreshed)
          return
        } catch (e) {
          if (!(e instanceof ApiError && e.status === 401)) throw e
          // Stored password no longer works — fall through to re-register
        }
      }

      // New player: register then immediately log in
      const email = `${username.toLowerCase().replace(/\s+/g, '')}@pokemongame.com`
      const password = crypto.randomUUID()

      try {
        await authApi.register(username, email, password)
      } catch (e) {
        if (e instanceof ApiError && e.status === 409) {
          setError('That name is already taken. Please choose a different one.')
          return
        }
        throw e
      }

      const res = await authApi.login(username, password)
      const newSession: PlayerSession = {
        username: res.username,
        email,
        password,
        token: res.token,
        expires_at: res.expires_at,
        player_id: res.player_id,
        has_chosen_starter: res.has_chosen_starter,
        chosen_starter: null,
      }
      persistPlayerSession(newSession)
      setSession(newSession)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed. Try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch profile once session is established
  useEffect(() => {
    if (session) refreshProfile()
  }, [session, refreshProfile])

  return (
    <PlayerContext.Provider
      value={{ session, profile, isLoading, error, login, updateSession, refreshProfile }}
    >
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider')
  return ctx
}
