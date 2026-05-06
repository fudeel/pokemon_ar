// game-development-frontend/context/PlayerContext.tsx

'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  /** Persist a local HP value for a given pokemon (battle damage, fainting). */
  setPokemonHp: (pokemonId: number, hp: number) => void
  /** Restore every party pokemon to full HP (used by Pokécenter). */
  healParty: () => void
  /** True when at least one pokemon in the party has HP > 0. */
  hasUsablePokemon: boolean
  /** True when at least one party pokemon has HP below its max. */
  partyNeedsHealing: boolean
}

const PlayerContext = createContext<PlayerContextValue | null>(null)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PlayerSession | null>(null)
  const [rawProfile, setRawProfile] = useState<PlayerProfile | null>(null)
  const [hpOverrides, setHpOverrides] = useState<Record<number, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshProfile = useCallback(async () => {
    try {
      const p = await apiClient.get<PlayerProfile>('/me/profile')
      setRawProfile(p)
    } catch {
      // profile fetch failure is non-fatal
    }
  }, [])

  const setPokemonHp = useCallback((pokemonId: number, hp: number) => {
    setHpOverrides((prev) => {
      if (prev[pokemonId] === hp) return prev
      return { ...prev, [pokemonId]: hp }
    })
  }, [])

  const healParty = useCallback(() => {
    setHpOverrides({})
  }, [])

  const profile = useMemo<PlayerProfile | null>(() => {
    if (!rawProfile) return null
    return {
      ...rawProfile,
      pokemon: rawProfile.pokemon.map((p) =>
        hpOverrides[p.id] !== undefined
          ? { ...p, current_hp: Math.max(0, Math.min(p.effective_stats.max_hp, hpOverrides[p.id])) }
          : p,
      ),
    }
  }, [rawProfile, hpOverrides])

  const hasUsablePokemon = useMemo(
    () => (profile?.pokemon ?? []).some((p) => p.current_hp > 0),
    [profile],
  )

  const partyNeedsHealing = useMemo(
    () =>
      (profile?.pokemon ?? []).some(
        (p) => p.current_hp < p.effective_stats.max_hp,
      ),
    [profile],
  )

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
      value={{
        session,
        profile,
        isLoading,
        error,
        login,
        updateSession,
        refreshProfile,
        setPokemonHp,
        healParty,
        hasUsablePokemon,
        partyNeedsHealing,
      }}
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
