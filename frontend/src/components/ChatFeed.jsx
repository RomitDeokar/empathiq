import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Circle } from 'lucide-react'
import { EmotionTag } from './EmotionTag'

function formatTime(timestamp) {
  if (!timestamp) return ''
  try {
    const d = new Date(timestamp)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch (_) {
    return ''
  }
}

function FrustrationPip({ score }) {
  if (score === undefined || score === null) return null
  const color =
    score >= 7 ? '#FF453A' :
    score >= 5 ? '#FF6B35' :
    score >= 3 ? '#FFD60A' : '#30D158'
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full"
      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
    >
      {score.toFixed(1)}
    </span>
  )
}

export function ChatFeed({ history = [], analyzing, customerName, onToggleResolved }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [history.length, analyzing])

  if (!history.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8 py-12">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          💬
        </div>
        <div>
          <p className="text-white/50 text-sm font-semibold mb-1">No messages yet</p>
          <p className="text-white/25 text-xs leading-relaxed max-w-xs">
            Type a customer message below and EmpathIQ will analyze their emotional state in real time.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4 pb-3">
      <AnimatePresence initial={false}>
        {history.map((msg, idx) => (
          <motion.div
            key={msg.id ?? idx}
            initial={msg.isNew ? { opacity: 0, y: 10, scale: 0.97 } : false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="flex flex-col gap-1.5 animate-slide-up"
          >
            {/* Bubble row */}
            <div className="flex items-start gap-2.5">
              {/* Avatar */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5"
                style={{
                  background: 'rgba(90,200,250,0.12)',
                  border: '1px solid rgba(90,200,250,0.22)',
                  color: '#5AC8FA',
                }}
              >
                {customerName ? customerName[0].toUpperCase() : 'C'}
              </div>

              {/* Message */}
              <div className="flex-1 min-w-0">
                <div
                  className="rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm leading-relaxed"
                  style={{
                    background: msg.resolved
                      ? 'rgba(48,209,88,0.05)'
                      : 'rgba(255,255,255,0.04)',
                    border: msg.resolved
                      ? '1px solid rgba(48,209,88,0.18)'
                      : '1px solid rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.82)',
                  }}
                >
                  {msg.message}
                </div>
              </div>

              {/* Resolved toggle */}
              {onToggleResolved && (
                <button
                  onClick={() => onToggleResolved(msg.id, !msg.resolved)}
                  className="flex-shrink-0 mt-1.5 text-white/20 hover:text-white/60 transition-colors"
                  title={msg.resolved ? 'Mark unresolved' : 'Mark resolved'}
                >
                  {msg.resolved
                    ? <CheckCircle2 size={15} className="text-green-500/70" />
                    : <Circle size={15} />
                  }
                </button>
              )}
            </div>

            {/* Meta row — fixed: use pl-10-custom class or inline style instead of pl-9.5 */}
            <div className="flex items-center gap-2 flex-wrap" style={{ paddingLeft: '38px' }}>
              {msg.emotion_label && (
                <EmotionTag
                  label={msg.emotion_label}
                  color={msg.emotion_color || '#8E8E93'}
                  icon={msg.emotion_icon || '😐'}
                  size="xs"
                />
              )}
              {msg.frustration_score != null && (
                <FrustrationPip score={msg.frustration_score} />
              )}
              {msg.timestamp && (
                <span className="text-white/25 text-[10px]">{formatTime(msg.timestamp)}</span>
              )}
              {msg.issue_category && msg.issue_category !== 'general' && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}
                >
                  {msg.issue_category}
                </span>
              )}
              {msg.resolved && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(48,209,88,0.1)', color: '#30D158', border: '1px solid rgba(48,209,88,0.2)' }}
                >
                  resolved
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Typing / analyzing indicator */}
      <AnimatePresence>
        {analyzing && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl ml-9"
            style={{
              background: 'rgba(90,200,250,0.05)',
              border: '1px solid rgba(90,200,250,0.12)',
            }}
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: '#5AC8FA' }}
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
                />
              ))}
            </div>
            <span className="text-xs text-sky-400/60">Analyzing emotional context…</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={bottomRef} />
    </div>
  )
}
