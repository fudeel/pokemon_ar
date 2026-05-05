// game-development-frontend/lib/battle/damageCalculator.ts

import { typeEffectiveness } from './typeChart'

export interface AttackerStats {
  level: number
  attack: number
  specialAttack: number
  types: string[]
}

export interface DefenderStats {
  defense: number
  specialDefense: number
  types: string[]
}

export interface MoveData {
  power: number | null
  accuracy: number | null
  type: string
  category: string
}

export interface DamageResult {
  damage: number
  effectiveness: number
  isCritical: boolean
  isStab: boolean
  wasMissed: boolean
}

/**
 * Calculates damage using the Generation-3 formula:
 *   base = floor((floor(2L/5 + 2) * P * A / D) / 50) + 2
 *
 * Then multiplied by STAB (1.5), type effectiveness, critical hit (1.5),
 * and a random factor in [0.85, 1.0].
 */
export function calculateDamage(
  move: MoveData,
  attacker: AttackerStats,
  defender: DefenderStats,
): DamageResult {
  // Accuracy roll
  if (move.accuracy !== null && Math.random() * 100 > move.accuracy) {
    return { damage: 0, effectiveness: 1, isCritical: false, isStab: false, wasMissed: true }
  }

  // Status moves never deal direct damage
  if (move.category === 'status' || move.power === null || move.power <= 0) {
    return { damage: 0, effectiveness: 1, isCritical: false, isStab: false, wasMissed: false }
  }

  const isCritical = Math.random() < 1 / 24
  const isStab = attacker.types.includes(move.type)
  const effectiveness = typeEffectiveness(move.type, defender.types)

  const atkStat = move.category === 'physical' ? attacker.attack : attacker.specialAttack
  const defStat = move.category === 'physical' ? defender.defense : defender.specialDefense

  const levelFactor = Math.floor(2 * attacker.level / 5 + 2)
  const base =
    Math.floor(Math.floor(levelFactor * move.power * atkStat / defStat) / 50) + 2

  const damage = Math.max(
    1,
    Math.floor(
      base *
        (isStab ? 1.5 : 1) *
        effectiveness *
        (isCritical ? 1.5 : 1) *
        (0.85 + Math.random() * 0.15),
    ),
  )

  return { damage, effectiveness, isCritical, isStab, wasMissed: false }
}
