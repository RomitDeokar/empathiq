import React from 'react'
import clsx from 'clsx'

export function FrustrationBadge({ score, size = 'md' }) {
  const getColor = (s) => {
    if (s >= 8) return { bg: 'rgba(255,45,85,0.15)', border: 'rgba(255,45,85,0.4)', text: '#FF2D55' }
    if (s >= 6) return { bg: 'rgba(255,107,53,0.15)', border: 'rgba(255,107,53,0.4)', text: '#FF6B35' }
    if (s >= 4) return { bg: 'rgba(255,204,0,0.12)', border: 'rgba(255,204,0,0.35)', text: '#FFCC00' }
    if (s >= 2) return { bg: 'rgba(90,200,250,0.1)', border: 'rgba(90,200,250,0.3)', text: '#5AC8FA' }
    return { bg: 'rgba(52,199,89,0.1)', border: 'rgba(52,199,89,0.3)', text: '#34C759' }
  }

  const getGlyph = (s) => {
    if (s >= 8) return '🔥'
    if (s >= 6) return '⚡'
    if (s >= 4) return '😤'
    if (s >= 2) return '😕'
    return '😊'
  }

  const color = getColor(score)
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  return (
    <span
      className={clsx('inline-flex items-center gap-1 rounded-full font-semibold', sizeClasses[size])}
      style={{
        background: color.bg,
        border: `1px solid ${color.border}`,
        color: color.text,
      }}
    >
      <span>{getGlyph(score)}</span>
      <span>{score.toFixed(1)}</span>
    </span>
  )
}
