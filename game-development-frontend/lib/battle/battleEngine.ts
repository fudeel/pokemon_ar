// game-development-frontend/lib/battle/battleEngine.ts

import {
  calculateDamage,
  type AttackerStats,
  type DefenderStats,
  type MoveData,
} from './damageCalculator'
import type { ActiveEncounter, PokemonInstance } from '@/types'

// ─── Domain Types ─────────────────────────────────────────────────────────────

export type BattlePhase =
  | 'intro'          // entrance animation is playing
  | 'idle'           // waiting for player input
  | 'resolving'      // a turn is being computed
  | 'enemy_fainted'  // wild pokemon HP reached 0 — player may throw pokeball or flee
  | 'player_fainted' // active pokemon HP reached 0 — must switch or accept defeat
  | 'all_fainted'    // no usable pokemon left — defeat
  | 'fled'           // player ran away

export interface WildCombatant {
  speciesName: string
  primaryType: string
  secondaryType: string | null
  level: number
  maxHp: number
  currentHp: number
  attack: number
  defense: number
  specialAttack: number
  specialDefense: number
  speed: number
}

export interface BattleMove {
  slot: number
  id: number
  name: string
  type: string
  category: string
  power: number | null
  accuracy: number | null
  maxPp: number
  currentPp: number
}

export interface BattleState {
  phase: BattlePhase
  wild: WildCombatant
  activePokemonId: number
  activePokemonName: string
  activePokemonLevel: number
  activePokemonPrimaryType: string
  activePokemonSecondaryType: string | null
  playerHp: number
  playerMaxHp: number
  playerAttack: number
  playerDefense: number
  playerSpecialAttack: number
  playerSpecialDefense: number
  playerSpeed: number
  moves: BattleMove[]
  log: string[]
  turn: number
}

// ─── Wild Pokemon Generation ──────────────────────────────────────────────────

function computeWildStat(
  base: number,
  iv: number,
  level: number,
  isHp: boolean,
): number {
  const scaled = Math.floor(((2 * base + iv) * level) / 100)
  return isHp ? scaled + level + 10 : scaled + 5
}

/**
 * Generates wild pokemon combat stats using the Gen-3 stat formula with
 * average base stats (50 for common pokemon, 75 for rare) and IV = 10.
 * This mirrors the backend StatCalculator without needing the full species data.
 */
function generateWildCombatant(encounter: ActiveEncounter): WildCombatant {
  const base = encounter.kind === 'rare' ? 75 : 50
  const iv = 10
  const { level } = encounter

  const calcStat = (b: number) => computeWildStat(b, iv, level, false)

  return {
    speciesName: encounter.speciesName,
    primaryType: 'normal',
    secondaryType: null,
    level,
    maxHp: computeWildStat(base, iv, level, true),
    currentHp: computeWildStat(base, iv, level, true),
    attack: calcStat(base),
    defense: calcStat(base),
    specialAttack: calcStat(base),
    specialDefense: calcStat(base),
    speed: calcStat(base),
  }
}

// ─── State Helpers ────────────────────────────────────────────────────────────

function displayName(pokemon: PokemonInstance): string {
  return pokemon.nickname?.trim() || pokemon.species.name
}

function appendLog(state: BattleState, ...messages: string[]): BattleState {
  return { ...state, log: [...state.log, ...messages] }
}

function extractMoves(pokemon: PokemonInstance): BattleMove[] {
  return pokemon.moves.map((em) => ({
    slot: em.slot,
    id: em.move.id,
    name: em.move.name,
    type: em.move.type,
    category: em.move.category,
    power: em.move.power,
    accuracy: em.move.accuracy,
    maxPp: em.move.pp,
    currentPp: em.current_pp,
  }))
}

// ─── Initialisation ───────────────────────────────────────────────────────────

export function initBattleState(
  encounter: ActiveEncounter,
  activePokemon: PokemonInstance,
): BattleState {
  const wild = generateWildCombatant(encounter)
  const stats = activePokemon.effective_stats
  const name = displayName(activePokemon)

  return {
    phase: 'intro',
    wild,
    activePokemonId: activePokemon.id,
    activePokemonName: name,
    activePokemonLevel: activePokemon.level,
    activePokemonPrimaryType: activePokemon.species.primary_type,
    activePokemonSecondaryType: activePokemon.species.secondary_type,
    playerHp: activePokemon.current_hp,
    playerMaxHp: stats.max_hp,
    playerAttack: stats.attack,
    playerDefense: stats.defense,
    playerSpecialAttack: stats.special_attack,
    playerSpecialDefense: stats.special_defense,
    playerSpeed: stats.speed,
    moves: extractMoves(activePokemon),
    log: [
      `Wild ${encounter.speciesName} appeared!`,
      `Go, ${name}!`,
    ],
    turn: 0,
  }
}

/** Called after the intro animation ends to allow player input. */
export function beginBattle(state: BattleState): BattleState {
  return { ...state, phase: 'idle' }
}

// ─── Turn Resolution ──────────────────────────────────────────────────────────

function resolvePlayerAttack(state: BattleState, moveIndex: number): BattleState {
  const move = state.moves[moveIndex]
  if (!move) return state

  if (move.currentPp <= 0) {
    return appendLog(state, `${move.name} has no PP left!`)
  }

  const updatedMoves = state.moves.map((m, i) =>
    i === moveIndex ? { ...m, currentPp: m.currentPp - 1 } : m,
  )
  let next: BattleState = { ...state, moves: updatedMoves }

  // Status moves are not yet fully mechanised; show a placeholder message
  if (move.category === 'status') {
    return appendLog(next, `${state.activePokemonName} used ${move.name}!`, 'But nothing happened…')
  }

  const attacker: AttackerStats = {
    level: state.activePokemonLevel,
    attack: state.playerAttack,
    specialAttack: state.playerSpecialAttack,
    types: [
      state.activePokemonPrimaryType,
      ...(state.activePokemonSecondaryType ? [state.activePokemonSecondaryType] : []),
    ],
  }
  const defenderStats: DefenderStats = {
    defense: state.wild.defense,
    specialDefense: state.wild.specialDefense,
    types: [
      state.wild.primaryType,
      ...(state.wild.secondaryType ? [state.wild.secondaryType] : []),
    ],
  }
  const moveData: MoveData = {
    power: move.power,
    accuracy: move.accuracy,
    type: move.type,
    category: move.category,
  }

  const result = calculateDamage(moveData, attacker, defenderStats)
  const newWildHp = Math.max(0, state.wild.currentHp - result.damage)
  const messages: string[] = [`${state.activePokemonName} used ${move.name}!`]

  if (result.wasMissed) {
    messages.push('But it missed!')
  } else {
    if (result.isCritical) messages.push('A critical hit!')
    if (result.effectiveness === 0)
      messages.push(`It doesn't affect ${state.wild.speciesName}…`)
    else if (result.effectiveness < 1) messages.push("It's not very effective…")
    else if (result.effectiveness > 1) messages.push("It's super effective!")
    messages.push(`Dealt ${result.damage} damage!`)
  }

  next = appendLog({ ...next, wild: { ...next.wild, currentHp: newWildHp } }, ...messages)

  if (newWildHp <= 0) {
    next = appendLog(
      { ...next, phase: 'enemy_fainted' },
      `Wild ${state.wild.speciesName} fainted!`,
    )
  }

  return next
}

function resolveWildAttack(state: BattleState): BattleState {
  const attacker: AttackerStats = {
    level: state.wild.level,
    attack: state.wild.attack,
    specialAttack: state.wild.specialAttack,
    types: [
      state.wild.primaryType,
      ...(state.wild.secondaryType ? [state.wild.secondaryType] : []),
    ],
  }
  const defenderStats: DefenderStats = {
    defense: state.playerDefense,
    specialDefense: state.playerSpecialDefense,
    types: [
      state.activePokemonPrimaryType,
      ...(state.activePokemonSecondaryType ? [state.activePokemonSecondaryType] : []),
    ],
  }
  // Wild pokemon always uses a basic tackle-equivalent (power 40, type normal)
  const moveData: MoveData = {
    power: 40,
    accuracy: 95,
    type: state.wild.primaryType,
    category: 'physical',
  }

  const result = calculateDamage(moveData, attacker, defenderStats)
  const newPlayerHp = Math.max(0, state.playerHp - result.damage)
  const messages: string[] = [`Wild ${state.wild.speciesName} attacked!`]

  if (result.wasMissed) {
    messages.push("But it missed!")
  } else {
    if (result.isCritical) messages.push('A critical hit!')
    if (result.effectiveness === 0) messages.push("It doesn't affect you…")
    else if (result.effectiveness < 1) messages.push("It's not very effective…")
    else if (result.effectiveness > 1) messages.push("It's super effective!")
    messages.push(`${state.activePokemonName} took ${result.damage} damage!`)
  }

  let next = appendLog({ ...state, playerHp: newPlayerHp }, ...messages)

  if (newPlayerHp <= 0) {
    next = appendLog(
      { ...next, phase: 'player_fainted' },
      `${state.activePokemonName} fainted!`,
    )
  }

  return next
}

/**
 * Executes a full turn: player uses move at `moveIndex`, then the wild
 * pokemon retaliates (if still alive). Faster combatant acts first.
 */
export function executeTurn(state: BattleState, moveIndex: number): BattleState {
  if (state.phase !== 'idle') return state

  const move = state.moves[moveIndex]
  if (!move) return state

  let next: BattleState = {
    ...state,
    phase: 'resolving',
    turn: state.turn + 1,
  }

  const playerFirst = state.playerSpeed >= state.wild.speed

  if (playerFirst) {
    next = resolvePlayerAttack(next, moveIndex)
    if (next.phase === 'resolving') {
      next = resolveWildAttack(next)
    }
  } else {
    next = resolveWildAttack(next)
    if (next.phase === 'resolving') {
      next = resolvePlayerAttack(next, moveIndex)
    }
  }

  if (next.phase === 'resolving') {
    next = { ...next, phase: 'idle' }
  }

  return next
}

/**
 * Switches the active player pokemon mid-battle. The new pokemon enters
 * with its profile HP (no persistent mid-battle HP tracking across switches).
 */
export function switchActivePokemon(
  state: BattleState,
  incoming: PokemonInstance,
): BattleState {
  const stats = incoming.effective_stats
  const name = displayName(incoming)

  return appendLog(
    {
      ...state,
      phase: 'idle',
      activePokemonId: incoming.id,
      activePokemonName: name,
      activePokemonLevel: incoming.level,
      activePokemonPrimaryType: incoming.species.primary_type,
      activePokemonSecondaryType: incoming.species.secondary_type,
      playerHp: incoming.current_hp,
      playerMaxHp: stats.max_hp,
      playerAttack: stats.attack,
      playerDefense: stats.defense,
      playerSpecialAttack: stats.special_attack,
      playerSpecialDefense: stats.special_defense,
      playerSpeed: stats.speed,
      moves: extractMoves(incoming),
    },
    `Go, ${name}!`,
  )
}
