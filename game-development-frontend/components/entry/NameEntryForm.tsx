// game-development-frontend/components/entry/NameEntryForm.tsx

'use client'

import { useState, type FormEvent } from 'react'
import ErrorMessage from '@/components/ui/ErrorMessage'

interface NameEntryFormProps {
  isLoading: boolean
  error: string | null
  onSubmit: (name: string) => void
}

export default function NameEntryForm({ isLoading, error, onSubmit }: NameEntryFormProps) {
  const [name, setName] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed.length < 2 || trimmed.length > 20) return
    onSubmit(trimmed)
  }

  const isOnlyLetters = /^[a-zA-Z]*$/.test(name)
  const isValid = name.trim().length >= 2 && name.trim().length <= 20 && isOnlyLetters

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-sm mx-4 text-center">
        <div className="text-6xl mb-6">⚡</div>
        <h1 className="text-3xl font-bold text-yellow-400 mb-2 tracking-widest uppercase">
          Pokémon AR
        </h1>
        <p className="text-slate-400 mb-10 text-sm">Your real-world adventure begins</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z]/g, ''))}
              placeholder="Enter your trainer name"
              maxLength={20}
              autoFocus
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-5 py-4 text-white text-center text-lg placeholder:text-slate-500 focus:outline-none focus:border-yellow-400 transition-colors"
            />
            <p className="text-slate-500 text-xs mt-1">
              Letters only · 2–20 characters · {name.length}/20
            </p>
          </div>

          {error && <ErrorMessage message={error} />}

          <button
            type="submit"
            disabled={!isValid || isLoading}
            className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 font-bold rounded-xl py-4 text-lg transition-colors"
          >
            {isLoading ? 'Entering world…' : 'Start Adventure'}
          </button>
        </form>
      </div>
    </div>
  )
}
