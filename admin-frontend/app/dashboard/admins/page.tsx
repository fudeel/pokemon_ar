// admin-frontend/app/dashboard/admins/page.tsx
'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { AdminForm } from '@/components/admins/AdminForm'
import { Card } from '@/components/ui/Card'

export default function AdminsPage() {
  const [showForm, setShowForm] = useState(false)
  const [created, setCreated] = useState<number[]>([])

  const handleCreated = (id: number) => {
    setCreated((prev) => [...prev, id])
    setShowForm(false)
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Admin Accounts"
        subtitle="Manage admin users"
        actions={
          <Button size="sm" onClick={() => setShowForm(true)}>
            + New Admin
          </Button>
        }
      />

      <div className="flex-1 p-6">
        <Card className="max-w-lg">
          <p className="text-sm text-gray-400 mb-4">
            Create additional admin accounts. Admins have full access to this panel.
          </p>
          {created.length > 0 && (
            <div className="space-y-2 mb-4">
              {created.map((id) => (
                <div
                  key={id}
                  className="flex items-center gap-2 text-sm text-green-400 bg-green-900/20 border border-green-800 rounded px-3 py-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Admin #{id} created successfully
                </div>
              ))}
            </div>
          )}
          <Button onClick={() => setShowForm(true)}>Create Admin Account</Button>
        </Card>
      </div>

      {showForm && (
        <Modal title="New Admin Account" onClose={() => setShowForm(false)} width="sm">
          <AdminForm onCreated={handleCreated} onCancel={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  )
}
