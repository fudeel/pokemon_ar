// admin-frontend/components/species/SpeciesMovesPanel.tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import { listSpeciesMoves, setSpeciesMoves, listMoves } from '@/lib/api/admin'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { MoveForm } from './MoveForm'
import type { LearnableMove, Move, PokemonSpecies } from '@/types'

interface SpeciesMovesPanelProps {
  species: PokemonSpecies
}

export function SpeciesMovesPanel({ species }: SpeciesMovesPanelProps) {
  const [learnableMoves, setLearnableMoves] = useState<LearnableMove[]>([])
  const [allMoves, setAllMoves] = useState<Move[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showMoveForm, setShowMoveForm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [current, library] = await Promise.all([
        listSpeciesMoves(species.id),
        listMoves(),
      ])
      setLearnableMoves(current)
      setAllMoves(library)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load moves.')
    } finally {
      setLoading(false)
    }
  }, [species.id])

  useEffect(() => { load() }, [load])

  // Selecting from the dropdown immediately adds the move at level 1
  const handleDropdownSelect = (moveId: string) => {
    if (!moveId) return
    const id = parseInt(moveId, 10)
    const move = allMoves.find((m) => m.id === id)
    if (!move) return
    setLearnableMoves((prev) => {
      if (prev.some((lm) => lm.move.id === id)) return prev
      return [...prev, { move, learn_level: 1 }]
    })
  }

  // Editable learn level per row
  const updateLearnLevel = (moveId: number, raw: string) => {
    const level = parseInt(raw, 10)
    if (!level || level < 1 || level > 100) return
    setLearnableMoves((prev) =>
      prev.map((lm) => (lm.move.id === moveId ? { ...lm, learn_level: level } : lm)),
    )
  }

  const removeMove = (moveId: number) => {
    setLearnableMoves((prev) => prev.filter((lm) => lm.move.id !== moveId))
  }

  // After creating a new move, add it to the library and the pending list
  const handleMoveSaved = (move: Move) => {
    setAllMoves((prev) => {
      const exists = prev.find((m) => m.id === move.id)
      return exists ? prev.map((m) => (m.id === move.id ? move : m)) : [...prev, move]
    })
    setLearnableMoves((prev) => {
      if (prev.some((lm) => lm.move.id === move.id)) return prev
      return [...prev, { move, learn_level: 1 }]
    })
    setShowMoveForm(false)
  }

  const save = async () => {
    if (learnableMoves.length === 0) {
      setError('Add at least one move before saving.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const updated = await setSpeciesMoves(
        species.id,
        learnableMoves.map((lm) => ({ move_id: lm.move.id, learn_level: lm.learn_level })),
      )
      setLearnableMoves(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save moves.')
    } finally {
      setSaving(false)
    }
  }

  const unassignedMoves = allMoves.filter(
    (m) => !learnableMoves.some((lm) => lm.move.id === m.id),
  )

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin w-6 h-6 rounded-full border-2 border-pokered border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <ErrorMessage message={error} />}

      <p className="text-xs text-gray-400">
        Moves for <span className="text-gray-200 font-medium">{species.name}</span>. At least one
        move with learn level ≤ 5 is required for starter selection.
      </p>

      {/* Current learnable moves */}
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
          Learnable Moves ({learnableMoves.length})
        </p>
        {learnableMoves.length === 0 ? (
          <p className="text-sm text-gray-500 py-2">No moves assigned yet.</p>
        ) : (
          <div className="border border-surface-3 rounded divide-y divide-surface-3">
            {learnableMoves
              .slice()
              .sort((a, b) => a.learn_level - b.learn_level)
              .map((lm) => (
                <div key={lm.move.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    defaultValue={lm.learn_level}
                    onBlur={(e) => updateLearnLevel(lm.move.id, e.target.value)}
                    className="w-14 rounded bg-surface-3 border border-surface-3 px-2 py-1 text-xs text-gray-100 text-center focus:outline-none focus:ring-1 focus:ring-pokered"
                    title="Learn level"
                  />
                  <span className="text-gray-100 font-medium flex-1">{lm.move.name}</span>
                  <span className="text-gray-500 text-xs capitalize hidden sm:inline">
                    {lm.move.type} · {lm.move.category}
                    {lm.move.power ? ` · Pwr ${lm.move.power}` : ''}
                  </span>
                  <button
                    onClick={() => removeMove(lm.move.id)}
                    className="text-red-400 hover:text-red-300 text-xs shrink-0"
                  >
                    Remove
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Add from library */}
      {!showMoveForm && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Add Move</p>
          {unassignedMoves.length > 0 ? (
            <Select
              placeholder="— pick a move to add —"
              value=""
              onChange={(e) => handleDropdownSelect(e.target.value)}
              options={unassignedMoves.map((m) => ({
                value: String(m.id),
                label: `${m.name} (${m.category}, ${m.type})`,
              }))}
            />
          ) : (
            <p className="text-xs text-gray-500">All moves in the library are already assigned.</p>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowMoveForm(true)}>
            + Create new move
          </Button>
        </div>
      )}

      {/* Inline move creator */}
      {showMoveForm && (
        <div className="border border-surface-3 rounded p-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            New Move
          </p>
          <MoveForm onSaved={handleMoveSaved} onCancel={() => setShowMoveForm(false)} />
        </div>
      )}

      {/* Save */}
      <div className="flex justify-end pt-1">
        <Button onClick={save} loading={saving}>
          Save Moves
        </Button>
      </div>
    </div>
  )
}
