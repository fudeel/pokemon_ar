// admin-frontend/components/quests/QuestForm.tsx
'use client'

import { useEffect, useState, type FormEvent } from 'react'
import {
  createQuest,
  listItems,
  listNpcs,
  listQuests,
  listSpecies,
  updateQuest,
  type QuestPayload,
} from '@/lib/api/admin'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import {
  EMPTY_OBJECTIVE,
  QuestObjectiveEditor,
  type ObjectiveDraft,
} from './QuestObjectiveEditor'
import { QuestRewardEditor, type ItemRewardDraft } from './QuestRewardEditor'
import type { Item, Npc, PokemonSpecies, Quest } from '@/types'

interface QuestFormProps {
  initial?: Quest
  onSaved: (quest: Quest) => void
  onCancel: () => void
}

function objectivesFromQuest(quest: Quest): ObjectiveDraft[] {
  return quest.objectives
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((o) => ({
      objective_type: o.objective_type,
      description: o.description,
      target_quantity: o.target_quantity,
      target_item_id: o.target_item_id,
      target_species_id: o.target_species_id,
      target_pokemon_type: o.target_pokemon_type,
      target_npc_id: o.target_npc_id,
      target_lat: o.target_lat,
      target_lng: o.target_lng,
      target_radius_meters: o.target_radius_meters,
      target_level: o.target_level,
    }))
}

function itemRewardsFromQuest(quest: Quest): ItemRewardDraft[] {
  return quest.reward.items.map((r) => ({ item_id: r.item_id, quantity: r.quantity }))
}

export function QuestForm({ initial, onSaved, onCancel }: QuestFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [minimumLevel, setMinimumLevel] = useState(initial?.minimum_level ?? 1)
  const [pokecoins, setPokecoins] = useState(initial?.reward.pokecoins ?? 0)
  const [experience, setExperience] = useState(initial?.reward.experience ?? 0)
  const [timeLimit, setTimeLimit] = useState<string>(
    initial?.time_limit_seconds != null ? String(initial.time_limit_seconds) : '',
  )
  const [isRepeatable, setIsRepeatable] = useState(initial?.is_repeatable ?? false)
  const [followUpId, setFollowUpId] = useState<string>(
    initial?.follow_up_quest_id != null ? String(initial.follow_up_quest_id) : '',
  )
  const [objectives, setObjectives] = useState<ObjectiveDraft[]>(
    initial ? objectivesFromQuest(initial) : [{ ...EMPTY_OBJECTIVE }],
  )
  const [itemRewards, setItemRewards] = useState<ItemRewardDraft[]>(
    initial ? itemRewardsFromQuest(initial) : [],
  )

  const [items, setItems] = useState<Item[]>([])
  const [species, setSpecies] = useState<PokemonSpecies[]>([])
  const [npcs, setNpcs] = useState<Npc[]>([])
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const [i, s, n, q] = await Promise.all([listItems(), listSpecies(), listNpcs(), listQuests()])
        if (cancelled) return
        setItems(i)
        setSpecies(s)
        setNpcs(n)
        setQuests(q)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load reference data.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim() || objectives.length === 0) return
    setSaving(true)
    setError(null)
    try {
      const payload: QuestPayload = {
        title: title.trim(),
        description: description.trim(),
        minimum_level: minimumLevel,
        reward_pokecoins: pokecoins,
        reward_experience: experience,
        time_limit_seconds: timeLimit !== '' ? parseInt(timeLimit, 10) : null,
        is_repeatable: isRepeatable,
        follow_up_quest_id: followUpId !== '' ? parseInt(followUpId, 10) : null,
        objectives: objectives.map((o) => ({
          objective_type: o.objective_type,
          description: o.description,
          target_quantity: o.target_quantity,
          target_item_id: o.target_item_id,
          target_species_id: o.target_species_id,
          target_pokemon_type: o.target_pokemon_type,
          target_npc_id: o.target_npc_id,
          target_lat: o.target_lat,
          target_lng: o.target_lng,
          target_radius_meters: o.target_radius_meters,
          target_level: o.target_level,
        })),
        item_rewards: itemRewards.map((r) => ({ item_id: r.item_id, quantity: r.quantity })),
      }
      const result = initial ? await updateQuest(initial.id, payload) : await createQuest(payload)
      onSaved(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save quest.')
    } finally {
      setSaving(false)
    }
  }

  const updateObjective = (index: number, next: ObjectiveDraft) => {
    setObjectives((prev) => prev.map((o, i) => (i === index ? next : o)))
  }

  const removeObjective = (index: number) => {
    setObjectives((prev) => prev.filter((_, i) => i !== index))
  }

  const addObjective = () => {
    setObjectives((prev) => [...prev, { ...EMPTY_OBJECTIVE }])
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin w-6 h-6 rounded-full border-2 border-pokered border-t-transparent" />
      </div>
    )
  }

  const followUpOptions = quests
    .filter((q) => q.id !== initial?.id)
    .map((q) => ({ value: String(q.id), label: `#${q.id} ${q.title}` }))

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <ErrorMessage message={error} />}

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g. The Missing Pikachu"
        />
        <Input
          label="Minimum Level"
          type="number"
          min={1}
          max={100}
          value={String(minimumLevel)}
          onChange={(e) => setMinimumLevel(Math.max(1, parseInt(e.target.value, 10) || 1))}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          required
          className="w-full rounded bg-surface-3 border border-surface-3 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pokered"
          placeholder="Quest narrative shown to the player when they accept it."
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Time Limit (seconds)"
          type="number"
          min={1}
          value={timeLimit}
          onChange={(e) => setTimeLimit(e.target.value)}
          placeholder="optional"
        />
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-gray-300 pb-2">
            <input
              type="checkbox"
              checked={isRepeatable}
              onChange={(e) => setIsRepeatable(e.target.checked)}
              className="accent-pokered"
            />
            Repeatable
          </label>
        </div>
        <Select
          label="Follow-up Quest"
          value={followUpId}
          onChange={(e) => setFollowUpId(e.target.value)}
          placeholder="— none —"
          options={followUpOptions}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Objectives ({objectives.length})
          </p>
          <Button type="button" size="sm" variant="ghost" onClick={addObjective}>
            + Add Objective
          </Button>
        </div>
        <div className="flex flex-col gap-3">
          {objectives.map((o, idx) => (
            <QuestObjectiveEditor
              key={idx}
              index={idx}
              objective={o}
              items={items}
              species={species}
              npcs={npcs}
              onChange={(next) => updateObjective(idx, next)}
              onRemove={() => removeObjective(idx)}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Reward</p>
        <QuestRewardEditor
          pokecoins={pokecoins}
          experience={experience}
          itemRewards={itemRewards}
          items={items}
          onPokecoinsChange={setPokecoins}
          onExperienceChange={setExperience}
          onItemRewardsChange={setItemRewards}
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          loading={saving}
          disabled={!title.trim() || !description.trim() || objectives.length === 0}
        >
          {initial ? 'Save Quest' : 'Create Quest'}
        </Button>
      </div>
    </form>
  )
}
