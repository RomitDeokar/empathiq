import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Zap, CheckCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react'

const URGENCY_CONFIG = {
  LOW: {
    gradient: 'linear-gradient(145deg, #081a0e 0%, #060f0a 100%)',
    border: 'rgba(48, 209, 88, 0.28)',
    glow: '0 0 50px rgba(48, 209, 88, 0.1)',
    accent: '#30D158',
    headerBg: 'rgba(48, 209, 88, 0.07)',
    label: 'LOW RISK',
    Icon: CheckCircle,
  },
  MODERATE: {
    gradient: 'linear-gradient(145deg, #1a1500 0%, #110e00 100%)',
    border: 'rgba(255, 214, 10, 0.3)',
    glow: '0 0 50px rgba(255, 214, 10, 0.1)',
    accent: '#FFD60A',
    headerBg: 'rgba(255, 214, 10, 0.07)',
    label: 'MODERATE',
    Icon: AlertTriangle,
  },
  HIGH: {
    gradient: 'linear-gradient(145deg, #1a0d00 0%, #110800 100%)',
    border: 'rgba(255, 159, 10, 0.35)',
    glow: '0 0 50px rgba(255, 159, 10, 0.14)',
    accent: '#FF9F0A',
    headerBg: 'rgba(255, 159, 10, 0.09)',
    label: 'HIGH RISK',
    Icon: Zap,
  },
  CRITICAL: {
    gradient: 'linear-gradient(145deg, #1c0900 0%, #120600 100%)',
    border: 'rgba(255, 107, 53, 0.4)',
    glow: '0 0 50px rgba(255, 107, 53, 0.18)',
    accent: '#FF6B35',
    headerBg: 'rgba(255, 107, 53, 0.1)',
    label: 'CRITICAL',
    Icon: AlertTriangle,
  },
  EMERGENCY: {
    gradient: 'linear-gradient(145deg, #1e0010 0%, #140008 100%)',
    border: 'rgba(255, 55, 95, 0.45)',
    glow: '0 0 50px rgba(255, 55, 95, 0.22), 0 0 100px rgba(255, 55, 95, 0.08)',
    accent: '#FF375F',
    headerBg: 'rgba(255, 55, 95, 0.12)',
    label: 'EMERGENCY',
    Icon: AlertTriangle,
  },
}

function AnimatedCount({ value, color, suffix = '' }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const target = value
    const duration = 900
    const start = performance.now()

    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(parseFloat((target * eased).toFixed(1)))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value])

  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, scale: 0.75 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className="text-4xl font-black tabular-nums leading-none"
      style={{ color, textShadow: `0 0 28px ${color}55` }}
    >
      {display.toFixed(1)}{suffix}
    </motion.span>
  )
}

function ScoreBar({ value, max = 10, color }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div
      className="w-full h-1.5 rounded-full overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.06)' }}
    >
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.85, ease: 'easeOut' }}
        style={{ background: `linear-gradient(90deg, ${color}80, ${color})`, boxShadow: `0 0 8px ${color}60` }}
      />
    </div>
  )
}

function TrajectoryChip({ trajectory }) {
  const map = {
    escalating: { Icon: TrendingUp,   color: '#FF453A', label: 'Escalating' },
    improving:  { Icon: TrendingDown, color: '#30D158', label: 'Improving'  },
    stable:     { Icon: Minus,        color: '#8E8E93', label: 'Stable'     },
  }
  const cfg = map[trajectory] || map.stable
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}28` }}
    >
      <cfg.Icon size={11} />
      {cfg.label}
    </span>
  )
}

function ActionList({ actions = [], color }) {
  return (
    <ul className="space-y-0">
      {actions.map((action, i) => (
        <motion.li
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 + i * 0.07 }}
          className="flex items-start gap-2.5 py-2 border-b border-white/[0.04] last:border-0"
        >
          <span
            className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
            style={{ background: `${color}18`, color, border: `1px solid ${color}35` }}
          >
            {i + 1}
          </span>
          <span className="text-[13px] text-white/75 leading-snug">{action}</span>
        </motion.li>
      ))}
    </ul>
  )
}

function FlagRow({ flags = [], color }) {
  if (!flags.length) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {flags.map((f) => (
        <span
          key={f}
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
          style={{ background: `${color}12`, color: `${color}bb`, border: `1px solid ${color}28` }}
        >
          {f.replace(/_/g, ' ')}
        </span>
      ))}
    </div>
  )
}

function ActionFlags({ strategy, color }) {
  const items = [
    { key: 'skip_greeting',  label: 'Skip Greeting', icon: '🚫' },
    { key: 'escalate_human', label: 'Human Agent',   icon: '👤' },
    { key: 'offer_credit',   label: 'Offer Credit',  icon: '💳' },
    { key: 'flag_churn_risk', label: 'Churn Flag',   icon: '⚠️' },
  ]
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {items.map(({ key, label, icon }) => {
        const active = strategy?.[key]
        return (
          <div
            key={key}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium"
            style={{
              background: active ? `${color}10` : 'rgba(255,255,255,0.025)',
              border: `1px solid ${active ? `${color}30` : 'rgba(255,255,255,0.05)'}`,
              color: active ? color : 'rgba(255,255,255,0.2)',
            }}
          >
            <span>{icon}</span>
            <span>{label}</span>
            {active && <div className="w-1 h-1 rounded-full ml-auto" style={{ background: color }} />}
          </div>
        )
      })}
    </div>
  )
}

function EmptyCard() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 p-8 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        🧠
      </div>
      <div>
        <h3 className="text-white/60 font-semibold text-base mb-1.5">Awaiting Analysis</h3>
        <p className="text-white/30 text-xs leading-relaxed max-w-52">
          Select a customer and send a message to generate a real-time strategy card.
        </p>
      </div>
      <div className="w-full max-w-56 space-y-1.5">
        {['Emotion detection', 'Frustration scoring', 'Strategy generation'].map((label, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/30"
            style={{ background: 'rgba(255,255,255,0.025)' }}
          >
            <div className="w-1 h-1 rounded-full bg-sky-500/50" />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}

export const StrategyCard = React.memo(function StrategyCard({ analysis }) {
  if (!analysis) return <EmptyCard />

  const { emotion, sentiment, frustration, strategy } = analysis
  const urgency = strategy?.urgency || 'LOW'
  const cfg = URGENCY_CONFIG[urgency] || URGENCY_CONFIG.LOW
  const { accent, Icon } = cfg

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${strategy?.id}-${frustration?.frustration_score}`}
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="flex flex-col rounded-2xl overflow-hidden h-full"
        style={{
          background: cfg.gradient,
          border: `1px solid ${cfg.border}`,
          boxShadow: cfg.glow,
        }}
      >
        {/* ── Card header ── */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
          style={{ background: cfg.headerBg, borderColor: `${accent}18` }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${accent}18`, border: `1px solid ${accent}38` }}
            >
              <Icon size={14} style={{ color: accent }} />
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: `${accent}80` }}>
                Strategy Card
              </div>
              <div className="text-xs font-semibold text-white/85 leading-tight">{strategy?.label}</div>
            </div>
          </div>
          <span
            className="text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full uppercase"
            style={{ background: `${accent}18`, border: `1px solid ${accent}45`, color: accent }}
          >
            {cfg.label}
          </span>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* Score row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Frustration */}
            <div
              className="rounded-xl p-3"
              style={{ background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.055)' }}
            >
              <div className="text-[10px] text-white/35 font-semibold uppercase tracking-wider mb-2">
                Frustration
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <AnimatedCount value={frustration?.frustration_score || 0} color={accent} />
                <span className="text-white/25 text-sm font-light">/ 10</span>
              </div>
              <ScoreBar value={frustration?.frustration_score || 0} max={10} color={accent} />
            </div>

            {/* Churn */}
            <div
              className="rounded-xl p-3"
              style={{ background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.055)' }}
            >
              <div className="text-[10px] text-white/35 font-semibold uppercase tracking-wider mb-2">
                Churn Risk
              </div>
              <div className="flex items-baseline gap-0.5 mb-2">
                <AnimatedCount
                  value={Math.round((frustration?.churn_probability || 0) * 100)}
                  color={accent}
                />
                <span className="text-white/25 text-sm font-light ml-0.5">%</span>
              </div>
              <ScoreBar value={(frustration?.churn_probability || 0) * 10} max={10} color={accent} />
            </div>
          </div>

          {/* Emotion + Trajectory */}
          <div
            className="flex items-center justify-between px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{emotion?.icon || '😐'}</span>
              <div>
                <div className="text-[10px] text-white/35 uppercase tracking-wider">Emotion</div>
                <div className="text-xs font-semibold" style={{ color: emotion?.color || '#8E8E93' }}>
                  {emotion?.label || '—'}
                  <span className="text-white/25 font-normal ml-1.5 text-[10px]">
                    {Math.round((emotion?.confidence || 0) * 100)}%
                  </span>
                </div>
              </div>
            </div>
            <TrajectoryChip trajectory={frustration?.trajectory || 'stable'} />
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Tickets',    value: frustration?.interaction_count || 0,   icon: '🎫' },
              { label: 'Unresolved', value: frustration?.unresolved_count || 0,    icon: '📌' },
              { label: 'Sentiment',  value: sentiment?.label || 'Neutral',         icon: '💬', text: true },
            ].map(({ label, value, icon, text }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1 py-2.5 rounded-xl"
                style={{ background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <span className="text-base leading-none">{icon}</span>
                <span className="text-xs font-bold text-white/80">{value}</span>
                <span className="text-[10px] text-white/30">{label}</span>
              </div>
            ))}
          </div>

          {/* Active flags */}
          <FlagRow flags={frustration?.flags || []} color={accent} />

          {/* Divider */}
          <div className="border-t border-dashed" style={{ borderColor: `${accent}20` }} />

          {/* Recommended actions */}
          <div>
            <div
              className="text-[10px] font-bold uppercase tracking-widest mb-2.5"
              style={{ color: `${accent}70` }}
            >
              Recommended Actions
            </div>
            <ActionList actions={strategy?.actions || []} color={accent} />
          </div>

          {/* Tone guidance */}
          {strategy?.tone_guidance && (
            <div
              className="px-3.5 py-3 rounded-xl"
              style={{ background: `${accent}08`, border: `1px solid ${accent}18` }}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: `${accent}55` }}>
                Tone Guidance
              </div>
              <p className="text-xs text-white/55 leading-relaxed italic">
                "{strategy.tone_guidance}"
              </p>
            </div>
          )}

          {/* Reasoning */}
          {strategy?.reasoning?.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: `${accent}70` }}>
                Why This Strategy
              </div>
              <div className="space-y-1.5">
                {strategy.reasoning.map((r, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.06 }}
                    className="flex items-start gap-2 text-[11px] text-white/45"
                  >
                    <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: accent }} />
                    {r}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Action flags grid */}
          <ActionFlags strategy={strategy} color={accent} />

        </div>
      </motion.div>
    </AnimatePresence>
  )
})
