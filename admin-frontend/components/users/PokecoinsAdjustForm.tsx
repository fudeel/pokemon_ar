// admin-frontend/components/users/PokecoinsAdjustForm.tsx
'use client'

import { useState, type FormEvent } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { adjustUserPokecoins } from '@/lib/api/admin'
import type { PlayerDetail, PokecoinsAdjustPayload } from '@/types'

const MODE_OPTIONS = [
  { value: 'delta', label: 'Add / subtract a delta' },
  { value: 'set', label: 'Set absolute balance' },
]

interface PokecoinsAdjustFormProps {
  playerId: number
  currentBalance: number
  onAdjusted: (detail: PlayerDetail) => void
}

export function PokecoinsAdjustForm({
  playerId,
  currentBalance,
  onAdjusted,
}: PokecoinsAdjustFormProps) {
  const [mode, setMode] = useState<'delta' | 'set'>('delta')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (amount.trim() === '') {
      setError('Enter an amount.')
      return
    }
    const numeric = parseInt(amount, 10)
    if (Number.isNaN(numeric)) {
      setError('Amount must be an integer.')
      return
    }

    let payload: PokecoinsAdjustPayload
    if (mode === 'delta') {
      if (numeric === 0) {
        setError('Delta cannot be zero.')
        return
      }
      if (currentBalance + numeric < 0) {
        setError(
          `Resulting balance would be negative (${currentBalance + numeric}).`,
        )
        return
      }
      payload = { delta: numeric, notes: notes.trim() || null }
    } else {
      if (numeric < 0) {
        setError('Absolute balance cannot be negative.')
        return
      }
      payload = { set_to: numeric, notes: notes.trim() || null }
    }

    setSaving(true)
    try {
      const result = await adjustUserPokecoins(playerId, payload)
      setSuccess(`Balance updated. New balance: ${result.player.pokecoins.toLocaleString()}.`)
      setAmount('')
      setNotes('')
      onAdjusted(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to adjust pokecoins.')
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

      <div className="text-sm text-gray-400">
        Current balance:{' '}
        <span className="font-mono text-yellow-300">
          {currentBalance.toLocaleString()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Mode"
          value={mode}
          onChange={(e) => setMode(e.target.value as 'delta' | 'set')}
          options={MODE_OPTIONS}
        />
        <Input
          label={mode === 'delta' ? 'Delta (positive or negative)' : 'New balance'}
          type="number"
          step={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={mode === 'delta' ? '+500 or -100' : '1000'}
          required
        />
      </div>

      <Input
        label="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="reason for the adjustment"
        maxLength={255}
      />

      <p className="text-xs text-gray-500">
        Every change is appended to the wallet ledger as an{' '}
        <code className="bg-surface-3 px-1 rounded">admin_grant</code> transaction.
      </p>

      <div className="flex justify-end">
        <Button type="submit" loading={saving}>Apply Adjustment</Button>
      </div>
    </form>
  )
}
