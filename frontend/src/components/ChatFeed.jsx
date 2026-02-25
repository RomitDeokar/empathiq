import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EmotionTag } from './EmotionTag'
import clsx from 'clsx'

function formatTime(timestamp) {
  if (!timestamp) return ''
  try {
    const d = new Date(timestamp)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

function FrustrationIndicator({ score }) {
  if (score === undefined || score === null) return null
  const color = score >= 7 ? '#FF2D55' : score >= 5 ? '#FF6B35' : score >= 3 ? '#FFCC00' : '#34C759'
  return (
    <div className="flex items-center gap-1">
      <div className="w-1 h-1 rounded-full" style={{ background: color }} />
      <span className="text-xs" style={{ color: `${color}aa` }}>{score.toFixed(1)}</span>
    </div>
  )
}

export function ChatFeed({ history, analyzing, customerName }) {
  const bottomRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, analyzing])

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-white/4 flex items-center justify-center text-3xl">
          💬
        </div>
        <div>
          <p className="text-white/50 text-sm font-medium mb-1">No conversation yet</p>
          <p className="text-white/25 text-xs leading-relaxed">
            Type a message below or run a demo scenario to see EmpathIQ in action
          </p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-3 p-4 pb-2">
      <AnimatePresence initial={false}>
        {history.map((msg, idx) => (
          <motion.div
            key={msg.id || idx}
            initial={msg.isNew ? { opacity: 0, y: 12, scale: 0.97 } : { opacity: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="flex flex-col gap-1.5"
          >
            {/* Message bubble */}
            <div className="flex items-start gap-2.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                style={{
                  background: 'rgba(90, 200, 250, 0.15)',
                  border: '1px solid rgba(90, 200, 250, 0.25)',
                  color: '#5AC8FA',
                }}
              >
                {customerName ? customerName[0].toUpperCase() : 'C'}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-white/85 leading-relaxed"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {msg.message}
                </div>
              </div>
            </div>

            {/* Metadata row */}
            <div className="flex items-center gap-3 pl-9.5 flex-wrap">
              {msg.emotion_label && (
                <EmotionTag
                  label={msg.emotion_label}
                  color={msg.emotion_color || '#8E8E93'}
                  icon={msg.emotion_icon || '😐'}
                  size="xs"
                />
              )}
              {msg.frustration_score !== undefined && (
                <FrustrationIndicator score={msg.frustration_score} />
              )}
              {msg.timestamp && (
                <span className="text-white/25 text-xs">{formatTime(msg.timestamp)}</span>
              )}
              {msg.issue_category && msg.issue_category !== 'general' && (
                <span className="text-xs text-white/25 bg-white/5 px-2 py-0.5 rounded-full">
                  {msg.issue_category}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Analyzing indicator */}
      <AnimatePresence>
        {analyzing && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: 'rgba(90,200,250,0.06)', border: '1px solid rgba(90,200,250,0.15)' }}
          >
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-sky-400"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
            <span className="text-xs text-sky-400/70">EmpathIQ analyzing emotional context...</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={bottomRef} />
    </div>
  )
}
