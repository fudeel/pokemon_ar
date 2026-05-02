// game-development-frontend/app/layout.tsx

import type { Metadata, Viewport } from 'next'
import './globals.css'
import { PlayerProvider } from '@/context/PlayerContext'
import { WorldProvider } from '@/context/WorldContext'

export const metadata: Metadata = {
  title: 'Pokémon AR',
  description: 'Real-world Pokémon adventure',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PlayerProvider>
          <WorldProvider>
            <main>{children}</main>
          </WorldProvider>
        </PlayerProvider>
      </body>
    </html>
  )
}
