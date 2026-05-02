// admin-frontend/components/map/EditSpawnAreaModal.tsx
'use client'

import { Modal } from '@/components/ui/Modal'
import { SpawnAreaForm } from './forms/SpawnAreaForm'
import type { PokemonSpecies, SpawnArea } from '@/types'

interface EditSpawnAreaModalProps {
  area: SpawnArea
  species: PokemonSpecies[]
  onSaved: (updated: SpawnArea) => void
  onClose: () => void
}

export function EditSpawnAreaModal({ area, species, onSaved, onClose }: EditSpawnAreaModalProps) {
  return (
    <Modal title={`Edit Spawn Area — ${area.name}`} onClose={onClose} width="md">
      <SpawnAreaForm
        latitude={area.center.latitude}
        longitude={area.center.longitude}
        species={species}
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
