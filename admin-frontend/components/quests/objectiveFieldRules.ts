// admin-frontend/components/quests/objectiveFieldRules.ts

import type { QuestObjectiveType } from '@/types'

export interface ObjectiveFields {
  needsItem: boolean
  needsSpecies: boolean
  needsType: boolean
  needsNpc: boolean
  needsLocation: boolean
  needsLevel: boolean
  needsQuantity: boolean
}

const NONE: ObjectiveFields = {
  needsItem: false,
  needsSpecies: false,
  needsType: false,
  needsNpc: false,
  needsLocation: false,
  needsLevel: false,
  needsQuantity: true,
}

export function fieldsForObjectiveType(type: QuestObjectiveType): ObjectiveFields {
  switch (type) {
    case 'gather_item':
      return { ...NONE, needsItem: true }
    case 'defeat_wild_pokemon':
      return { ...NONE, needsSpecies: true, needsType: true }
    case 'defeat_trainer':
      return { ...NONE, needsNpc: true }
    case 'deliver_item':
      return { ...NONE, needsItem: true, needsNpc: true }
    case 'talk_to_npc':
      return { ...NONE, needsNpc: true, needsQuantity: false }
    case 'explore_area':
      return { ...NONE, needsLocation: true, needsQuantity: false }
    case 'catch_pokemon':
      return { ...NONE, needsSpecies: true, needsType: true }
    case 'escort_npc':
      return { ...NONE, needsNpc: true, needsLocation: true, needsQuantity: false }
    case 'reach_level':
      return { ...NONE, needsLevel: true, needsQuantity: false }
    default:
      return NONE
  }
}
