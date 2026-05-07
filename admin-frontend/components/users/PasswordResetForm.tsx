// admin-frontend/components/users/PasswordResetForm.tsx
'use client'

import { useState, type FormEvent } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { resetUserPassword } from '@/lib/api/admin'

interface PasswordResetFormProps {
  playerId: number
}

export function PasswordResetForm({ playerId }: PasswordResetFormProps) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setSaving(true)
    try {
      await resetUserPassword(playerId, { new_password: password })
      setSuccess('Password updated. The new password takes effect immediately.')
      setPassword('')
      setConfirm('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      {error && <ErrorMessage message={error} />}
      {success && (
        <div className="text-xs text-green-400 bg-green-900/20 border border-green-800 rounded px-3 py-2">
          {success}
        </div>
      )}

      <Input
        label="New Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
        maxLength={128}
        placeholder="Min. 8 characters"
      />
      <Input
        label="Confirm Password"
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
        minLength={8}
        maxLength={128}
      />

      <div className="flex justify-end">
        <Button type="submit" loading={saving}>Reset Password</Button>
      </div>
    </form>
  )
}
