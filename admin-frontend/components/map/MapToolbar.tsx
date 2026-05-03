// admin-frontend/components/map/MapToolbar.tsx
'use client'

import { classNames } from '@/lib/utils'
import type { EntityType } from '@/types'

interface ToolbarItem {
  type: EntityType
  label: string
  color: string
  icon: React.ReactNode
}

const TOOLBAR_ITEMS: ToolbarItem[] = [
  {
    type: 'map_object',
    label: 'Map Object',
    color: '#6b7280',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    type: 'npc',
    label: 'NPC',
    color: '#8b5cf6',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    type: 'spawn_area',
    label: 'Spawn Area',
    color: '#10b981',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  {
    type: 'event_area',
    label: 'Event Area',
    color: '#f59e0b',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    type: 'gym',
    label: 'Gym',
    color: '#ef4444',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M5 10v9a1 1 0 001 1h3v-4h6v4h3a1 1 0 001-1v-9" />
      </svg>
    ),
  },
  {
    type: 'rare_pokemon',
    label: 'Rare Pokémon',
    color: '#ec4899',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  {
    type: 'world_item',
    label: 'World Item',
    color: '#f97316',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    type: 'item_spawn_area',
    label: 'Item Zone',
    color: '#fb923c',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
  },
]

interface MapToolbarProps {
  activeType: EntityType | null
  onSelect: (type: EntityType | null) => void
}

export function MapToolbar({ activeType, onSelect }: MapToolbarProps) {
  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-surface-2 border-b border-surface-3">
      <span className="text-xs text-gray-400 mr-2">Place:</span>
      {TOOLBAR_ITEMS.map((item) => {
        const isActive = activeType === item.type
        return (
          <button
            key={item.type}
            onClick={() => onSelect(isActive ? null : item.type)}
            title={item.label}
            className={classNames(
              'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all',
              isActive
                ? 'text-white shadow-md'
                : 'bg-surface-3 text-gray-400 hover:text-gray-100 hover:bg-gray-600',
            )}
            style={isActive ? { backgroundColor: item.color } : undefined}
          >
            {item.icon}
            {item.label}
          </button>
        )
      })}
      {activeType && (
        <span className="ml-auto text-xs text-amber-400 animate-pulse">
          Click on the map to place
        </span>
      )}
    </div>
  )
}
