import React from 'react'
import clsx from 'clsx'

export function FrustrationBadge({ score = 0, size = 'md' }) {
  const getStyle = (s) => {
    if (s >= 8) return { bg: 'rgba(255,59,48,0.14)',  border: 'rgba(255,59,48,0.38)',  text: '#FF453A' }
    if (s >= 6) return { bg: 'rgba(255,107,53,0.14)', border: 'rgba(255,107,53,0.38)', text: '#FF6B35' }
    if (s >= 4) return { bg: 'rgba(255,214,10,0.12)', border: 'rgba(255,214,10,0.32)', text: '#FFD60A' }
    if (s >= 2) return { bg: 'rgba(90,200,250,0.1)',  border: 'rgba(90,200,250,0.28)', text: '#5AC8FA' }
    return        { bg: 'rgba(48,209,88,0.1)',  border: 'rgba(48,209,88,0.28)',  text: '#30D158' }
  }

  const getIcon = (s) => {
    if (s >= 8) return '🔥'
    if (s >= 6) return '⚡'
    if (s >= 4) return '😤'
    if (s >= 2) return '😕'
    return '😊'
  }

  const { bg, border, text } = getStyle(score)

  const sizeStyles = {
    sm: { fontSize: 11, padding: '2px 7px', gap: 3 },
    md: { fontSize: 12, padding: '3px 9px', gap: 4 },
    lg: { fontSize: 14, padding: '4px 11px', gap: 5 },
  }
  const s = sizeStyles[size] || sizeStyles.md

  return (
    <span
      className="inline-flex items-center rounded-full font-bold tabular-nums"
      style={{
        background: bg,
        border: `1px solid ${border}`,
        color: text,
        fontSize: s.fontSize,
        padding: s.padding,
        gap: s.gap,
      }}
    >
      <span>{getIcon(score)}</span>
      <span>{typeof score === 'number' ? score.toFixed(1) : score}</span>
    </span>
  )
}
