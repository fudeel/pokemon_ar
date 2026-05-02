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

function sessionKey(username: string) {
  return `pokemon_player_${username.toLowerCase()}`
}

function loadStoredSession(username: string): PlayerSession | null {
  try {
    const raw = localStorage.getItem(sessionKey(username))
    return raw ? (JSON.parse(raw) as PlayerSession) : null
  } catch {
    return null
  }
}

function persistSession(session: PlayerSession): void {
  localStorage.setItem(sessionKey(session.username), JSON.stringify(session))
  localStorage.setItem('pokemon_active_session', JSON.stringify(session))
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PlayerSession | null>(null)
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
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
      persistSession(updated)
      return updated
    })
  }, [])

  const login = useCallback(async (username: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const stored = loadStoredSession(username)

      if (stored) {
        // Re-authenticate with stored credentials to get a fresh token
        try {
          const res = await authApi.login(stored.username, stored.password)
          const refreshed: PlayerSession = {
            ...stored,
            token: res.token,
            expires_at: res.expires_at,
            has_chosen_starter: res.has_chosen_starter,
          }
          persistSession(refreshed)
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
      }
      persistSession(newSession)
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
