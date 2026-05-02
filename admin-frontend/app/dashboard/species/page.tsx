// admin-frontend/app/dashboard/species/page.tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SpeciesList } from '@/components/species/SpeciesList'
import { SpeciesForm } from '@/components/species/SpeciesForm'
import { SpeciesMovesPanel } from '@/components/species/SpeciesMovesPanel'
import { listSpecies } from '@/lib/api/admin'
import type { PokemonSpecies } from '@/types'

export default function SpeciesPage() {
  const [species, setSpecies] = useState<PokemonSpecies[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<PokemonSpecies | null>(null)
  const [managingMoves, setManagingMoves] = useState<PokemonSpecies | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listSpecies()
      setSpecies(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSaved = useCallback((saved: PokemonSpecies) => {
    setSpecies((prev) => {
      const exists = prev.find((s) => s.id === saved.id)
      return exists ? prev.map((s) => (s.id === saved.id ? saved : s)) : [...prev, saved]
    })
    setShowForm(false)
    setEditing(null)
  }, [])

  const handleEdit = useCallback((s: PokemonSpecies) => {
    setEditing(s)
    setShowForm(true)
  }, [])

  const handleClose = useCallback(() => {
    setShowForm(false)
    setEditing(null)
  }, [])

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Pokémon Species"
        subtitle={`${species.length} species defined`}
        actions={
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true) }}>
            + Add Species
          </Button>
        }
      />

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 rounded-full border-2 border-pokered border-t-transparent" />
          </div>
        ) : (
          <SpeciesList
            species={species}
            onEdit={handleEdit}
            onManageMoves={setManagingMoves}
          />
        )}
      </div>

      {showForm && (
        <Modal
          title={editing ? `Edit #${editing.id} ${editing.name}` : 'New Species'}
          onClose={handleClose}
          width="lg"
        >
          <SpeciesForm
            initial={editing ?? undefined}
            onSaved={handleSaved}
            onCancel={handleClose}
          />
        </Modal>
      )}

      {managingMoves && (
        <Modal
          title={`Moves — #${managingMoves.id} ${managingMoves.name}`}
          onClose={() => setManagingMoves(null)}
          width="lg"
        >
          <SpeciesMovesPanel species={managingMoves} />
        </Modal>
      )}
    </div>
  )
}
