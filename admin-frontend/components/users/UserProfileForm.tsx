// admin-frontend/components/users/UserProfileForm.tsx
'use client'

import { useState, type FormEvent } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { updateUser } from '@/lib/api/admin'
import type { PlayerDetail, PlayerProfile, PlayerUpdatePayload } from '@/types'

interface UserProfileFormProps {
  player: PlayerProfile
  onSaved: (detail: PlayerDetail) => void
}

export function UserProfileForm({ player, onSaved }: UserProfileFormProps) {
  const [username, setUsername] = useState(player.username)
  const [email, setEmail] = useState(player.email)
  const [level, setLevel] = useState(String(player.level))
  const [experience, setExperience] = useState(String(player.experience))
  const [hasStarter, setHasStarter] = useState(player.has_chosen_starter)
  const [latitude, setLatitude] = useState(
    player.location ? String(player.location.latitude) : '',
  )
  const [longitude, setLongitude] = useState(
    player.location ? String(player.location.longitude) : '',
  )

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const levelNum = parseInt(level, 10)
    const expNum = parseInt(experience, 10)
    if (Number.isNaN(levelNum) || levelNum < 1 || levelNum > 100) {
      setError('Level must be between 1 and 100.')
      return
    }
    if (Number.isNaN(expNum) || expNum < 0) {
      setError('Experience must be a non-negative integer.')
      return
    }

    let location: PlayerUpdatePayload['location'] = null
    const hasLat = latitude.trim() !== ''
    const hasLng = longitude.trim() !== ''
    if (hasLat !== hasLng) {
      setError('Provide both latitude and longitude, or leave both blank.')
      return
    }
    if (hasLat && hasLng) {
      const lat = parseFloat(latitude)
      const lng = parseFloat(longitude)
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        setError('Latitude and longitude must be numbers.')
        return
      }
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        setError('Latitude must be in [-90, 90] and longitude in [-180, 180].')
        return
      }
      location = { latitude: lat, longitude: lng }
    }

    setSaving(true)
    try {
      const payload: PlayerUpdatePayload = {
        username: username.trim(),
        email: email.trim(),
        level: levelNum,
        experience: expNum,
        has_chosen_starter: hasStarter,
        location,
      }
      const result = await updateUser(player.id, payload)
      setSuccess('Player profile updated.')
      onSaved(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const clearLocation = () => {
    setLatitude('')
    setLongitude('')
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      {error && <ErrorMessage message={error} />}
      {success && (
        <div className="text-xs text-green-400 bg-green-900/20 border border-green-800 rounded px-3 py-2">
          {success}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={1}
          maxLength={64}
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          maxLength={255}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Level"
          type="number"
          min={1}
          max={100}
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          required
        />
        <Input
          label="Experience"
          type="number"
          min={0}
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          required
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-300">
        <input
          type="checkbox"
          checked={hasStarter}
          onChange={(e) => setHasStarter(e.target.checked)}
          className="accent-pokered"
        />
        Player has chosen their starter
      </label>

      <div className="rounded border border-surface-3 p-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Last Known Location
          </p>
          {(latitude || longitude) && (
            <Button type="button" size="sm" variant="ghost" onClick={clearLocation}>
              Clear
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Latitude"
            type="number"
            step="any"
            min={-90}
            max={90}
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="—"
          />
          <Input
            label="Longitude"
            type="number"
            step="any"
            min={-180}
            max={180}
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="—"
          />
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <Button type="submit" loading={saving}>Save Profile</Button>
      </div>
    </form>
  )
}
