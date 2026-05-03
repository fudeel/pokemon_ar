// admin-frontend/components/quests/QuestObjectiveEditor.tsx
'use client'

import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import {
  POKEMON_TYPES,
  QUEST_OBJECTIVE_LABELS,
  QUEST_OBJECTIVE_TYPES,
  type Item,
  type Npc,
  type PokemonSpecies,
  type QuestObjectiveType,
} from '@/types'
import { fieldsForObjectiveType } from './objectiveFieldRules'

export interface ObjectiveDraft {
  objective_type: QuestObjectiveType
  description: string
  target_quantity: number
  target_item_id: number | null
  target_species_id: number | null
  target_pokemon_type: string | null
  target_npc_id: number | null
  target_lat: number | null
  target_lng: number | null
  target_radius_meters: number | null
  target_level: number | null
}

export const EMPTY_OBJECTIVE: ObjectiveDraft = {
  objective_type: 'gather_item',
  description: '',
  target_quantity: 1,
  target_item_id: null,
  target_species_id: null,
  target_pokemon_type: null,
  target_npc_id: null,
  target_lat: null,
  target_lng: null,
  target_radius_meters: null,
  target_level: null,
}

const TYPE_OPTIONS = QUEST_OBJECTIVE_TYPES.map((t) => ({ value: t, label: QUEST_OBJECTIVE_LABELS[t] }))
const POKEMON_TYPE_OPTIONS = POKEMON_TYPES.map((t) => ({
  value: t,
  label: t.charAt(0).toUpperCase() + t.slice(1),
}))

interface Props {
  index: number
  objective: ObjectiveDraft
  items: Item[]
  species: PokemonSpecies[]
  npcs: Npc[]
  onChange: (next: ObjectiveDraft) => void
  onRemove: () => void
}

export function QuestObjectiveEditor({
  index,
  objective,
  items,
  species,
  npcs,
  onChange,
  onRemove,
}: Props) {
  const fields = fieldsForObjectiveType(objective.objective_type)

  const update = <K extends keyof ObjectiveDraft>(key: K, value: ObjectiveDraft[K]) =>
    onChange({ ...objective, [key]: value })

  const onTypeChange = (next: string) => {
    const nextType = next as QuestObjectiveType
    const nextFields = fieldsForObjectiveType(nextType)
    onChange({
      ...EMPTY_OBJECTIVE,
      objective_type: nextType,
      description: objective.description,
      target_quantity: nextFields.needsQuantity ? objective.target_quantity || 1 : 1,
    })
  }

  return (
    <div className="border border-surface-3 rounded p-3 flex flex-col gap-3 bg-surface/40">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          Objective {index + 1}
        </span>
        <Button type="button" size="sm" variant="ghost" onClick={onRemove}>
          Remove
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Type"
          value={objective.objective_type}
          onChange={(e) => onTypeChange(e.target.value)}
          options={TYPE_OPTIONS}
        />
        {fields.needsQuantity && (
          <Input
            label="Quantity"
            type="number"
            min={1}
            value={String(objective.target_quantity)}
            onChange={(e) => update('target_quantity', Math.max(1, parseInt(e.target.value, 10) || 1))}
            required
          />
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          Description (shown to player)
        </label>
        <textarea
          value={objective.description}
          onChange={(e) => update('description', e.target.value)}
          rows={2}
          required
          className="w-full rounded bg-surface-3 border border-surface-3 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pokered"
          placeholder="e.g. Defeat 5 Pidgey near Pewter City"
        />
      </div>

      {fields.needsItem && (
        <Select
          label="Target Item"
          value={objective.target_item_id != null ? String(objective.target_item_id) : ''}
          onChange={(e) =>
            update('target_item_id', e.target.value ? parseInt(e.target.value, 10) : null)
          }
          placeholder="— pick an item —"
          options={items.map((i) => ({ value: String(i.id), label: i.name }))}
        />
      )}

      {fields.needsSpecies && (
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Target Species (optional)"
            value={objective.target_species_id != null ? String(objective.target_species_id) : ''}
            onChange={(e) =>
              update('target_species_id', e.target.value ? parseInt(e.target.value, 10) : null)
            }
            placeholder="— any species —"
            options={species.map((s) => ({ value: String(s.id), label: `#${s.id} ${s.name}` }))}
          />
          {fields.needsType && (
            <Select
              label="Target Type (optional)"
              value={objective.target_pokemon_type ?? ''}
              onChange={(e) => update('target_pokemon_type', e.target.value || null)}
              placeholder="— any type —"
              options={POKEMON_TYPE_OPTIONS}
            />
          )}
        </div>
      )}

      {fields.needsNpc && (
        <Select
          label="Target NPC"
          value={objective.target_npc_id != null ? String(objective.target_npc_id) : ''}
          onChange={(e) =>
            update('target_npc_id', e.target.value ? parseInt(e.target.value, 10) : null)
          }
          placeholder="— pick an NPC —"
          options={npcs.map((n) => ({ value: String(n.id), label: `#${n.id} ${n.name} (${n.role})` }))}
        />
      )}

      {fields.needsLocation && (
        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Latitude"
            type="number"
            step="0.000001"
            value={objective.target_lat != null ? String(objective.target_lat) : ''}
            onChange={(e) =>
              update('target_lat', e.target.value !== '' ? parseFloat(e.target.value) : null)
            }
          />
          <Input
            label="Longitude"
            type="number"
            step="0.000001"
            value={objective.target_lng != null ? String(objective.target_lng) : ''}
            onChange={(e) =>
              update('target_lng', e.target.value !== '' ? parseFloat(e.target.value) : null)
            }
          />
          <Input
            label="Radius (m)"
            type="number"
            min={1}
            value={objective.target_radius_meters != null ? String(objective.target_radius_meters) : ''}
            onChange={(e) =>
              update(
                'target_radius_meters',
                e.target.value !== '' ? parseFloat(e.target.value) : null,
              )
            }
          />
        </div>
      )}

      {fields.needsLevel && (
        <Input
          label="Target Player Level"
          type="number"
          min={1}
          max={100}
          value={objective.target_level != null ? String(objective.target_level) : ''}
          onChange={(e) =>
            update('target_level', e.target.value !== '' ? parseInt(e.target.value, 10) : null)
          }
        />
      )}
    </div>
  )
}
