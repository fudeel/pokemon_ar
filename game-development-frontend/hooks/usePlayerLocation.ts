// game-development-frontend/hooks/usePlayerLocation.ts

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { offsetPosition } from '@/lib/spawner/GeoUtils'
import type { PlayerPosition } from '@/types'

const WASD_STEP_METERS = 5
const WASD_TICK_MS = 120
const GPS_TIMEOUT_MS = 8_000

const DEFAULT_LAT = parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LAT ?? '41.9028')
const DEFAULT_LNG = parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LNG ?? '12.4964')

type Direction = 'north' | 'south' | 'east' | 'west'

const KEY_DIRECTION_MAP: Record<string, Direction> = {
  w: 'north',
  arrowup: 'north',
  s: 'south',
  arrowdown: 'south',
  d: 'east',
  arrowright: 'east',
  a: 'west',
  arrowleft: 'west',
}

export function usePlayerLocation() {
  const [position, setPosition] = useState<PlayerPosition | null>(null)
  const [locationSource, setLocationSource] = useState<'gps' | 'wasd' | null>(null)
  const [gpsUnavailable, setGpsUnavailable] = useState(false)

  const pressedKeys = useRef<Set<Direction>>(new Set())
  const gpsWatchId = useRef<number | null>(null)
  const wasdIntervalId = useRef<ReturnType<typeof setInterval> | null>(null)
  const positionRef = useRef<PlayerPosition | null>(null)

  const enableWasd = useCallback((startLat: number, startLng: number) => {
    const initial: PlayerPosition = {
      latitude: startLat,
      longitude: startLng,
      source: 'wasd',
    }
    positionRef.current = initial
    setPosition(initial)
    setLocationSource('wasd')

    if (wasdIntervalId.current) return

    wasdIntervalId.current = setInterval(() => {
      const keys = pressedKeys.current
      if (keys.size === 0) return

      let dLat = 0
      let dLng = 0
      if (keys.has('north')) dLat += WASD_STEP_METERS
      if (keys.has('south')) dLat -= WASD_STEP_METERS
      if (keys.has('east')) dLng += WASD_STEP_METERS
      if (keys.has('west')) dLng -= WASD_STEP_METERS

      if (dLat === 0 && dLng === 0) return

      setPosition((prev) => {
        if (!prev) return prev
        const next = {
          ...offsetPosition(prev, dLat, dLng),
          source: 'wasd' as const,
        }
        positionRef.current = next
        return next
      })
    }, WASD_TICK_MS)
  }, [])

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGpsUnavailable(true)
      enableWasd(DEFAULT_LAT, DEFAULT_LNG)
      return
    }

    const gpsTimeout = setTimeout(() => {
      if (!positionRef.current) {
        setGpsUnavailable(true)
        enableWasd(DEFAULT_LAT, DEFAULT_LNG)
      }
    }, GPS_TIMEOUT_MS)

    gpsWatchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        clearTimeout(gpsTimeout)
        const gpsPos: PlayerPosition = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          source: 'gps',
        }
        positionRef.current = gpsPos
        setPosition(gpsPos)
        setLocationSource('gps')

        // GPS acquired – also activate WASD as override
        if (!wasdIntervalId.current) {
          enableWasd(pos.coords.latitude, pos.coords.longitude)
        }
      },
      () => {
        clearTimeout(gpsTimeout)
        setGpsUnavailable(true)
        enableWasd(DEFAULT_LAT, DEFAULT_LNG)
      },
      { enableHighAccuracy: true, timeout: GPS_TIMEOUT_MS, maximumAge: 5_000 },
    )

    return () => {
      clearTimeout(gpsTimeout)
      if (gpsWatchId.current !== null) navigator.geolocation.clearWatch(gpsWatchId.current)
      if (wasdIntervalId.current) clearInterval(wasdIntervalId.current)
    }
  }, [enableWasd])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const dir = KEY_DIRECTION_MAP[e.key.toLowerCase()]
      if (dir) {
        e.preventDefault()
        pressedKeys.current.add(dir)
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      const dir = KEY_DIRECTION_MAP[e.key.toLowerCase()]
      if (dir) pressedKeys.current.delete(dir)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  return { position, locationSource, gpsUnavailable }
}
