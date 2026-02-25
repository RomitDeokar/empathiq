import React from 'react'
import { FrustrationBadge } from './FrustrationBadge'
import clsx from 'clsx'

const TIER_STYLES = {
  enterprise: 'tier-enterprise',
  pro: 'tier-pro',
  standard: 'tier-standard',
  free: 'tier-free',
}

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function ChurnBar({ probability }) {
  const pct = Math.round(probability * 100)
  const color = pct >= 70 ? '#FF2D55' : pct >= 45 ? '#FF6B35' : pct >= 25 ? '#FFCC00' : '#34C759'
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs font-medium" style={{ color }}>{pct}%</span>
    </div>
  )
}

export function CustomerList({ customers, selectedCustomer, onSelect }) {
  if (!customers || customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3 text-center px-4">
        <div className="text-3xl">🫙</div>
        <p className="text-white/40 text-sm">No customers yet</p>
        <p className="text-white/25 text-xs">Run a demo scenario to get started</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 p-3">
      {customers.map(customer => {
        const isSelected = selectedCustomer?.id === customer.id
        const score = customer.current_frustration_score || 0

        return (
          <button
            key={customer.id}
            onClick={() => onSelect(customer)}
            className={clsx(
              'w-full text-left rounded-xl p-3 transition-all duration-200 group',
              isSelected
                ? 'bg-white/8 border border-white/15 shadow-lg'
                : 'hover:bg-white/4 border border-transparent'
            )}
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${customer.avatar_color}88, ${customer.avatar_color}44)`,
                  border: `1.5px solid ${customer.avatar_color}55`,
                  color: customer.avatar_color,
                }}
              >
                {getInitials(customer.name)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={clsx(
                    'font-semibold text-sm truncate',
                    isSelected ? 'text-white' : 'text-white/80 group-hover:text-white'
                  )}>
                    {customer.name}
                  </span>
                  <span className={clsx('tier-badge', TIER_STYLES[customer.plan_tier] || 'tier-standard')}>
                    {customer.plan_tier}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/35 text-xs">{customer.interaction_count || 0} tickets</span>
                  <span className="text-white/20 text-xs">·</span>
                  <span className="text-white/35 text-xs">Churn risk</span>
                </div>
                <ChurnBar probability={customer.current_churn_probability || 0} />
              </div>

              {/* Score badge */}
              <FrustrationBadge score={score} size="sm" />
            </div>
          </button>
        )
      })}
    </div>
  )
}
