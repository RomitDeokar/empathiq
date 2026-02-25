import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Zap, CheckCircle, TrendingUp, TrendingDown, Minus, User, DollarSign, ArrowUp } from 'lucide-react'
import clsx from 'clsx'

const URGENCY_CONFIG = {
  LOW: {
    gradient: 'linear-gradient(135deg, #0d2818 0%, #0a1f14 100%)',
    border: 'rgba(52, 199, 89, 0.3)',
    glow: '0 0 40px rgba(52, 199, 89, 0.12), 0 0 80px rgba(52, 199, 89, 0.05)',
    accentColor: '#34C759',
    headerBg: 'rgba(52, 199, 89, 0.08)',
    label: 'LOW RISK',
    Icon: CheckCircle,
  },
  MODERATE: {
    gradient: 'linear-gradient(135deg, #1e1800 0%, #161200 100%)',
    border: 'rgba(255, 214, 10, 0.35)',
    glow: '0 0 40px rgba(255, 214, 10, 0.12), 0 0 80px rgba(255, 214, 10, 0.05)',
    accentColor: '#FFD60A',
    headerBg: 'rgba(255, 214, 10, 0.08)',
    label: 'MODERATE',
    Icon: AlertTriangle,
  },
  HIGH: {
    gradient: 'linear-gradient(135deg, #1e0e00 0%, #160a00 100%)',
    border: 'rgba(255, 159, 10, 0.4)',
    glow: '0 0 40px rgba(255, 159, 10, 0.18), 0 0 80px rgba(255, 159, 10, 0.08)',
    accentColor: '#FF9F0A',
    headerBg: 'rgba(255, 159, 10, 0.1)',
    label: 'HIGH RISK',
    Icon: Zap,
  },
  CRITICAL: {
    gradient: 'linear-gradient(135deg, #200a00 0%, #180600 100%)',
    border: 'rgba(255, 107, 53, 0.45)',
    glow: '0 0 40px rgba(255, 107, 53, 0.22), 0 0 80px rgba(255, 107, 53, 0.1)',
    accentColor: '#FF6B35',
    headerBg: 'rgba(255, 107, 53, 0.12)',
    label: 'CRITICAL',
    Icon: AlertTriangle,
  },
  EMERGENCY: {
    gradient: 'linear-gradient(135deg, #220010 0%, #180008 100%)',
    border: 'rgba(255, 45, 85, 0.5)',
    glow: '0 0 40px rgba(255, 45, 85, 0.28), 0 0 100px rgba(255, 45, 85, 0.12)',
    accentColor: '#FF2D55',
    headerBg: 'rgba(255, 45, 85, 0.15)',
    label: 'EMERGENCY',
    Icon: AlertTriangle,
  },
}

function AnimatedScore({ score, color }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const start = 0
    const end = score
    const duration = 1000
    const startTime = performance.now()
    const animate = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(parseFloat((start + (end - start) * eased).toFixed(1)))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [score])

  return (
    <motion.span
      key={score}
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="text-5xl font-black tabular-nums"
      style={{ color, textShadow: `0 0 30px ${color}66` }}
    >
      {display.toFixed(1)}
    </motion.span>
  )
}

function ScoreBar({ score, color }) {
  const pct = (score / 10) * 100
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
        style={{
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          boxShadow: `0 0 10px ${color}66`,
        }}
      />
    </div>
  )
}

function TrajectoryBadge({ trajectory }) {
  const config = {
    escalating: { Icon: TrendingUp, color: '#FF2D55', label: 'Escalating', bg: 'rgba(255,45,85,0.12)' },
    improving: { Icon: TrendingDown, color: '#34C759', label: 'Improving', bg: 'rgba(52,199,89,0.1)' },
    stable: { Icon: Minus, color: '#8E8E93', label: 'Stable', bg: 'rgba(142,142,147,0.1)' },
  }
  const { Icon, color, label, bg } = config[trajectory] || config.stable
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: bg, border: `1px solid ${color}30` }}>
      <Icon size={12} style={{ color }} />
      <span className="text-xs font-medium" style={{ color }}>{label}</span>
    </div>
  )
}

function ActionItem({ action, color, index }) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.08 }}
      className="flex items-start gap-3 py-2.5 border-b border-white/4 last:border-0"
    >
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
        style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
      >
        {index + 1}
      </div>
      <span className="text-sm text-white/80 leading-relaxed">{action}</span>
    </motion.li>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 p-8 text-center">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
        style={{ background: 'rgba(90,200,250,0.06)', border: '1px solid rgba(90,200,250,0.12)' }}
      >
        🧠
      </div>
      <div>
        <h3 className="text-white/70 font-semibold text-lg mb-2">Awaiting Analysis</h3>
        <p className="text-white/35 text-sm leading-relaxed max-w-xs">
          Select a customer and send a message, or run a demo scenario to see EmpathIQ generate a live strategy card.
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {['Emotional state detection', 'Frustration history scoring', 'Response strategy generation'].map((item, i) => (
          <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-sky-400/50" />
            <span className="text-xs text-white/35">{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function StrategyCard({ analysis }) {
  if (!analysis) return <EmptyState />

  const { emotion, sentiment, frustration, strategy } = analysis
  const urgency = strategy?.urgency || 'LOW'
  const config = URGENCY_CONFIG[urgency] || URGENCY_CONFIG.LOW
  const { Icon, accentColor } = config

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${strategy?.id}-${frustration?.frustration_score}`}
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="h-full flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: config.gradient,
          border: `1px solid ${config.border}`,
          boxShadow: config.glow,
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between border-b"
          style={{ background: config.headerBg, borderColor: `${accentColor}20` }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}40` }}
            >
              <Icon size={16} style={{ color: accentColor }} />
            </div>
            <div>
              <div className="text-xs font-bold tracking-widest" style={{ color: `${accentColor}99` }}>
                STRATEGY CARD
              </div>
              <div className="text-sm font-semibold text-white/90 leading-tight">{strategy?.label}</div>
            </div>
          </div>
          <div
            className="px-3 py-1 rounded-full text-xs font-bold tracking-wider"
            style={{
              background: `${accentColor}20`,
              border: `1px solid ${accentColor}50`,
              color: accentColor,
            }}
          >
            {config.label}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Score + Emotion Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Frustration Score */}
            <div
              className="rounded-xl p-4"
              style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="text-xs text-white/40 font-medium uppercase tracking-wider mb-2">
                Frustration Score
              </div>
              <div className="flex items-end gap-1.5 mb-3">
                <AnimatedScore score={frustration?.frustration_score || 0} color={accentColor} />
                <span className="text-white/30 text-lg font-light mb-1.5">/ 10</span>
              </div>
              <ScoreBar score={frustration?.frustration_score || 0} color={accentColor} />
            </div>

            {/* Churn Probability */}
            <div
              className="rounded-xl p-4"
              style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="text-xs text-white/40 font-medium uppercase tracking-wider mb-2">
                Churn Probability
              </div>
              <div className="flex items-end gap-1.5 mb-3">
                <motion.span
                  key={frustration?.churn_probability}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-5xl font-black"
                  style={{ color: accentColor, textShadow: `0 0 30px ${accentColor}66` }}
                >
                  {Math.round((frustration?.churn_probability || 0) * 100)}
                </motion.span>
                <span className="text-white/30 text-lg font-light mb-1.5">%</span>
              </div>
              <ScoreBar score={(frustration?.churn_probability || 0) * 10} color={accentColor} />
            </div>
          </div>

          {/* Emotion + Trajectory */}
          <div
            className="rounded-xl px-4 py-3 flex items-center justify-between"
            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{emotion?.icon || '😐'}</span>
              <div>
                <div className="text-xs text-white/40 uppercase tracking-wider">Current Emotion</div>
                <div className="font-semibold text-sm" style={{ color: emotion?.color || '#8E8E93' }}>
                  {emotion?.label || 'Unknown'}
                  <span className="text-white/30 font-normal text-xs ml-2">
                    {Math.round((emotion?.confidence || 0) * 100)}% conf.
                  </span>
                </div>
              </div>
            </div>
            <TrajectoryBadge trajectory={frustration?.trajectory || 'stable'} />
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Tickets', value: frustration?.interaction_count || 0, icon: '🎫' },
              { label: 'Unresolved', value: frustration?.unresolved_count || 0, icon: '⚠️' },
              { label: 'Sentiment', value: sentiment?.label || 'Neutral', icon: '💬', isText: true },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl p-3 text-center"
                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="text-lg mb-1">{stat.icon}</div>
                <div className="font-bold text-white/90 text-sm">
                  {stat.isText ? stat.value : stat.value}
                </div>
                <div className="text-white/30 text-xs">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Flags */}
          {frustration?.flags && frustration.flags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {frustration.flags.map(flag => (
                <span
                  key={flag}
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{
                    background: `${accentColor}15`,
                    border: `1px solid ${accentColor}30`,
                    color: `${accentColor}cc`,
                  }}
                >
                  {flag.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}

          {/* Divider */}
          <div
            className="border-t border-dashed"
            style={{ borderColor: `${accentColor}25` }}
          />

          {/* Recommended Actions */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: `${accentColor}80` }}>
              Recommended Actions
            </div>
            <ul className="space-y-0">
              {(strategy?.actions || []).map((action, i) => (
                <ActionItem key={i} action={action} color={accentColor} index={i} />
              ))}
            </ul>
          </div>

          {/* Tone Guidance */}
          {strategy?.tone_guidance && (
            <div
              className="rounded-xl px-4 py-3"
              style={{ background: `${accentColor}0a`, border: `1px solid ${accentColor}20` }}
            >
              <div className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: `${accentColor}60` }}>
                Tone Guidance
              </div>
              <p className="text-sm text-white/60 leading-relaxed italic">
                "{strategy.tone_guidance}"
              </p>
            </div>
          )}

          {/* Key Signals */}
          {strategy?.reasoning && strategy.reasoning.length > 0 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-widest mb-2.5" style={{ color: `${accentColor}80` }}>
                Why This Strategy
              </div>
              <div className="space-y-1.5">
                {strategy.reasoning.map((reason, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.06 }}
                    className="flex items-center gap-2.5 text-xs text-white/50"
                  >
                    <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: accentColor }} />
                    {reason}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Action Flags */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'skip_greeting', label: 'Skip Greeting', icon: '🚫' },
              { key: 'escalate_human', label: 'Escalate Human', icon: '👤' },
              { key: 'offer_credit', label: 'Offer Credit', icon: '💳' },
              { key: 'flag_churn_risk', label: 'Churn Flagged', icon: '⚠️' },
            ].map(({ key, label, icon }) => {
              const active = strategy?.[key]
              return (
                <div
                  key={key}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
                  style={{
                    background: active ? `${accentColor}12` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? `${accentColor}35` : 'rgba(255,255,255,0.06)'}`,
                    color: active ? accentColor : 'rgba(255,255,255,0.25)',
                  }}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                  {active && (
                    <div className="w-1.5 h-1.5 rounded-full ml-auto" style={{ background: accentColor }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
