// admin-frontend/components/map/EditSpawnAreaModal.tsx
'use client'

import { Modal } from '@/components/ui/Modal'
import { SpawnAreaForm } from './forms/SpawnAreaForm'
import type { Item, PokemonSpecies, SpawnArea } from '@/types'

interface EditSpawnAreaModalProps {
  area: SpawnArea
  species: PokemonSpecies[]
  items: Item[]
  onSaved: (updated: SpawnArea) => void
  onClose: () => void
}

export function EditSpawnAreaModal({ area, species, items, onSaved, onClose }: EditSpawnAreaModalProps) {
  return (
    <Modal title={`Edit Spawn Area — ${area.name}`} onClose={onClose} width="md">
      <SpawnAreaForm
        species={species}
        items={items}
        editing={area}
        onSaved={(updated) => {
          onSaved(updated)
          onClose()
        }}
        onCancel={onClose}
      />
    </Modal>
  )
}
