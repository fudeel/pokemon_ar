// admin-frontend/components/admins/AdminForm.tsx
'use client'

import { FormEvent, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { createAdmin } from '@/lib/api/admin'

interface AdminFormProps {
  onCreated: (id: number) => void
  onCancel: () => void
}

export function AdminForm({ onCreated, onCancel }: AdminFormProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await createAdmin(username.trim(), password)
      onCreated(res.id)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create admin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <ErrorMessage message={error} />
      <Input
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="new_admin"
        required
        minLength={3}
        maxLength={32}
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Min. 8 characters"
        required
        minLength={8}
      />
      <div className="flex gap-2">
        <Button type="submit" loading={loading} className="flex-1">Create Admin</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
