// game-development-frontend/lib/playerSessionStorage.ts

import type { PlayerSession } from '@/types'

const ACTIVE_SESSION_KEY = 'pokemon_active_session'

export function playerSessionKey(username: string): string {
  return `pokemon_player_${username.toLowerCase()}`
}

export function loadPlayerSession(username: string): PlayerSession | null {
  try {
    const raw = localStorage.getItem(playerSessionKey(username))
    return raw ? (JSON.parse(raw) as PlayerSession) : null
  } catch {
    return null
  }
}

export function loadActivePlayerSession(): PlayerSession | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY)
    return raw ? (JSON.parse(raw) as PlayerSession) : null
  } catch {
    return null
  }
}

export function persistPlayerSession(session: PlayerSession): void {
  localStorage.setItem(playerSessionKey(session.username), JSON.stringify(session))
  localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session))
}
