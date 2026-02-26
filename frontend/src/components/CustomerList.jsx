import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { FrustrationBadge } from './FrustrationBadge'
import clsx from 'clsx'

const TIER_CLASS = {
  enterprise: 'tier-enterprise',
  pro: 'tier-pro',
  standard: 'tier-standard',
  free: 'tier-free',
}

function getInitials(name = '') {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?'
}

function ChurnBar({ probability = 0 }) {
  const pct = Math.min(100, Math.round(probability * 100))
  const color =
    pct >= 70 ? '#FF453A' :
    pct >= 45 ? '#FF6B35' :
    pct >= 25 ? '#FFD60A' : '#30D158'
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ background: color }}
        />
      </div>
      <span className="text-[10px] font-semibold tabular-nums" style={{ color, minWidth: 28 }}>
        {pct}%
      </span>
    </div>
  )
}

export function CustomerList({ customers = [], selectedCustomer, onSelect, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(null)

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-6">
        <div className="text-3xl opacity-50">👥</div>
        <p className="text-white/40 text-sm font-medium">No customers yet</p>
        <p className="text-white/25 text-xs leading-relaxed">
          Click <span className="text-white/40 font-semibold">+ Add Customer</span> to create a support profile
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1 p-2">
      <AnimatePresence initial={false}>
        {customers.map((customer) => {
          const isSelected = selectedCustomer?.id === customer.id
          const score = customer.current_frustration_score || 0
          const isConfirming = confirmDelete === customer.id

          return (
            <motion.div
              key={customer.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            >
              {isConfirming ? (
                /* Delete confirmation row */
                <div
                  className="rounded-xl p-3 border"
                  style={{ background: 'rgba(255,59,48,0.07)', borderColor: 'rgba(255,59,48,0.25)' }}
                >
                  <p className="text-xs text-red-400 mb-2.5 font-medium">
                    Delete <span className="text-white/70">{customer.name}</span>? This removes all their history.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="btn-ghost text-xs py-1.5 px-3 flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => { onDelete(customer.id); setConfirmDelete(null) }}
                      className="btn-danger flex-1 justify-center"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                /* Normal customer row */
                <button
                  onClick={() => onSelect(customer)}
                  className={clsx(
                    'w-full text-left rounded-xl p-2.5 transition-all duration-150 group relative',
                    isSelected
                      ? 'bg-white/[0.07] border border-white/[0.12]'
                      : 'hover:bg-white/[0.04] border border-transparent'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Avatar */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        background: `${customer.avatar_color}20`,
                        border: `1.5px solid ${customer.avatar_color}40`,
                        color: customer.avatar_color,
                      }}
                    >
                      {getInitials(customer.name)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={clsx(
                          'text-xs font-semibold truncate',
                          isSelected ? 'text-white' : 'text-white/75 group-hover:text-white/90'
                        )}>
                          {customer.name}
                        </span>
                        <span className={clsx('tier-badge', TIER_CLASS[customer.plan_tier] || 'tier-standard')}>
                          {customer.plan_tier}
                        </span>
                      </div>
                      <div className="text-white/30 text-[10px] truncate">{customer.email}</div>
                      <ChurnBar probability={customer.current_churn_probability || 0} />
                    </div>

                    {/* Score + delete */}
                    <div className="flex flex-col items-end gap-1.5">
                      <FrustrationBadge score={score} size="sm" />
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(customer.id) }}
                        className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all p-0.5 rounded"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </button>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
