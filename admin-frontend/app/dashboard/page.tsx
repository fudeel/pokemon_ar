// admin-frontend/app/dashboard/page.tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { StatCard } from '@/components/ui/Card'
import {
  listEventAreas,
  listGyms,
  listMapObjects,
  listNpcs,
  listRarePokemon,
  listSpawnAreas,
  listSpecies,
} from '@/lib/api/admin'

interface WorldStats {
  species: number
  mapObjects: number
  npcs: number
  spawnAreas: number
  eventAreas: number
  gyms: number
  rarePokemon: number
}

interface QuickLinkProps {
  href: string
  label: string
  description: string
}

function QuickLink({ href, label, description }: QuickLinkProps) {
  return (
    <Link
      href={href}
      className="block rounded-lg bg-surface-2 border border-surface-3 p-4 hover:border-pokered transition-colors group"
    >
      <p className="text-sm font-medium text-gray-100 group-hover:text-pokered transition-colors">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{description}</p>
    </Link>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<WorldStats | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const [sp, mos, npcList, sas, eas, gymList, rares] = await Promise.all([
      listSpecies(),
      listMapObjects(),
      listNpcs(),
      listSpawnAreas(),
      listEventAreas(),
      listGyms(),
      listRarePokemon(),
    ])
    setStats({
      species: sp.length,
      mapObjects: mos.length,
      npcs: npcList.length,
      spawnAreas: sas.length,
      eventAreas: eas.length,
      gyms: gymList.length,
      rarePokemon: rares.length,
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="flex flex-col h-full overflow-auto">
      <Header title="Overview" subtitle="World of Humans — Admin Panel" />
      <div className="p-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 rounded-full border-2 border-pokered border-t-transparent" />
          </div>
        ) : stats ? (
          <>
            <section>
              <h2 className="text-xs text-gray-400 uppercase tracking-wide mb-3">World State</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Species" value={stats.species} />
                <StatCard label="Map Objects" value={stats.mapObjects} />
                <StatCard label="NPCs" value={stats.npcs} />
                <StatCard label="Spawn Areas" value={stats.spawnAreas} />
                <StatCard label="Event Areas" value={stats.eventAreas} />
                <StatCard label="Gyms" value={stats.gyms} />
                <StatCard label="Rare Pokémon" value={stats.rarePokemon} />
                <StatCard
                  label="Total Entities"
                  value={
                    stats.mapObjects +
                    stats.npcs +
                    stats.spawnAreas +
                    stats.eventAreas +
                    stats.gyms +
                    stats.rarePokemon
                  }
                />
              </div>
            </section>

            <section>
              <h2 className="text-xs text-gray-400 uppercase tracking-wide mb-3">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <QuickLink
                  href="/dashboard/map"
                  label="World Map"
                  description="Place or remove entities on the map"
                />
                <QuickLink
                  href="/dashboard/species"
                  label="Pokémon Species"
                  description="Define and update species data"
                />
                <QuickLink
                  href="/dashboard/admins"
                  label="Admin Accounts"
                  description="Create additional admin users"
                />
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  )
}
