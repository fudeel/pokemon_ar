// game-development-frontend/components/game/battle/BattleLog.tsx

'use client'

import { useEffect, useRef } from 'react'

interface BattleLogProps {
  messages: string[]
}

/**
 * Displays the last few battle log messages. Always scrolls to the bottom
 * so the most recent message is visible.
 */
export default function BattleLog({ messages }: BattleLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) return null

  const visible = messages.slice(-4)

  return (
    <div className="battle-log">
      {visible.map((msg, i) => (
        <p
          key={`${i}-${msg}`}
          className={i === visible.length - 1 ? 'battle-log-latest' : 'battle-log-old'}
        >
          {msg}
        </p>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
