// admin-frontend/components/map/EditItemSpawnAreaModal.tsx
'use client'

import { Modal } from '@/components/ui/Modal'
import { ItemSpawnAreaForm } from './forms/ItemSpawnAreaForm'
import type { Item, ItemSpawnArea } from '@/types'

interface EditItemSpawnAreaModalProps {
  area: ItemSpawnArea
  items: Item[]
  onSaved: (updated: ItemSpawnArea) => void
  onClose: () => void
}

export function EditItemSpawnAreaModal({ area, items, onSaved, onClose }: EditItemSpawnAreaModalProps) {
  return (
    <Modal title={`Edit Item Spawn Area — ${area.name}`} onClose={onClose} width="md">
      <ItemSpawnAreaForm
        latitude={area.center.latitude}
        longitude={area.center.longitude}
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
