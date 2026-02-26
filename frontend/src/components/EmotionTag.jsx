import React from 'react'

export function EmotionTag({ label, color = '#8E8E93', icon = '😐', size = 'sm' }) {
  const sizeStyles = {
    xs: { fontSize: 10, padding: '2px 6px', gap: 3 },
    sm: { fontSize: 11, padding: '2px 7px', gap: 3 },
    md: { fontSize: 12, padding: '3px 9px', gap: 4 },
  }
  const s = sizeStyles[size] || sizeStyles.sm

  return (
    <span
      className="inline-flex items-center rounded-full font-semibold"
      style={{
        background: `${color}14`,
        border: `1px solid ${color}30`,
        color,
        fontSize: s.fontSize,
        padding: s.padding,
        gap: s.gap,
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  )
}
