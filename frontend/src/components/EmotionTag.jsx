import React from 'react'
import clsx from 'clsx'

export function EmotionTag({ emotion, label, color, icon, size = 'sm' }) {
  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5 gap-0.5',
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1',
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        sizeClasses[size]
      )}
      style={{
        background: `${color}18`,
        border: `1px solid ${color}35`,
        color: color,
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  )
}
