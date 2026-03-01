import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Copy, Check, RefreshCw, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import API from '../api/empathiq'

const STRATEGY_COLORS = {
  emergency:   { bg: 'rgba(255,59,48,0.1)',   border: 'rgba(255,59,48,0.3)',   text: '#FF3B30' },
  churn_risk:  { bg: 'rgba(255,149,0,0.1)',   border: 'rgba(255,149,0,0.3)',   text: '#FF9500' },
  escalate:    { bg: 'rgba(255,214,10,0.1)',  border: 'rgba(255,214,10,0.3)',  text: '#FFD60A' },
  empathy:     { bg: 'rgba(90,200,250,0.1)',  border: 'rgba(90,200,250,0.3)',  text: '#5AC8FA' },
  standard:    { bg: 'rgba(52,199,89,0.1)',   border: 'rgba(52,199,89,0.3)',   text: '#34C759' },
}

export function AgentSuggestion({ customerId, latestMessage, analysis }) {
  const [suggestion, setSuggestion] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const fetchSuggestion = useCallback(async () => {
    if (!latestMessage || !analysis) return
    setLoading(true)
    setError(null)
    try {
      const res = await API.post('/generate-reply', {
        customer_id: customerId,
        message: latestMessage,
        strategy_level: analysis.strategy?.level || 'standard',
        emotion_raw: analysis.emotion?.raw_emotion || 'neutral',
        frustration_score: analysis.frustration?.frustration_score || 0,
        issue_category: analysis.issue_category || 'general',
      })
      setSuggestion(res.data)
    } catch (e) {
      setError('Could not generate suggestion.')
    } finally {
      setLoading(false)
    }
  }, [customerId, latestMessage, analysis])

  // Auto-fetch when a new message + analysis arrives
  useEffect(() => {
    if (latestMessage && analysis) fetchSuggestion()
  }, [latestMessage, analysis?.timestamp])

  const handleCopy = () => {
    if (!suggestion?.reply) return
    navigator.clipboard.writeText(suggestion.reply)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const strategyLevel = analysis?.strategy?.level || 'standard'
  const colors = STRATEGY_COLORS[strategyLevel] || STRATEGY_COLORS.standard

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, rgba(13,13,28,0.9), rgba(9,9,18,0.95))',
        border: `1px solid ${colors.border}`,
        boxShadow: `0 4px 24px ${colors.bg}`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}` }}
        onClick={() => setCollapsed((c) => !c)}
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: loading ? 360 : 0 }}
            transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: 'linear' }}
          >
            <Sparkles size={14} style={{ color: colors.text }} />
          </motion.div>
          <span className="text-xs font-semibold" style={{ color: colors.text }}>
            AI Suggested Reply
          </span>
          {suggestion?.method && (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.3)' }}
            >
              {suggestion.method === 'model' ? '🤖 model' : '📋 template'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {!collapsed && suggestion && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); fetchSuggestion() }}
                className="p-1 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/8 transition-all"
                title="Regenerate"
              >
                <RefreshCw size={11} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleCopy() }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: copied ? 'rgba(52,199,89,0.15)' : 'rgba(255,255,255,0.07)',
                  border: copied ? '1px solid rgba(52,199,89,0.3)' : '1px solid rgba(255,255,255,0.1)',
                  color: copied ? '#34C759' : 'rgba(255,255,255,0.5)',
                }}
              >
                {copied ? <Check size={11} /> : <Copy size={11} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </>
          )}
          {collapsed ? <ChevronDown size={13} className="text-white/30" /> : <ChevronUp size={13} className="text-white/30" />}
        </div>
      </div>

      {/* Body */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div className="px-4 py-3">
              {/* Empty state */}
              {!latestMessage && !loading && (
                <p className="text-xs text-white/25 italic">
                  Waiting for a customer message to analyze…
                </p>
              )}

              {/* Loading */}
              {loading && (
                <div className="flex items-center gap-2 py-1">
                  <Loader2 size={13} className="animate-spin" style={{ color: colors.text }} />
                  <span className="text-xs text-white/40">Generating reply…</span>
                </div>
              )}

              {/* Error */}
              {error && !loading && (
                <p className="text-xs text-red-400">{error}</p>
              )}

              {/* Suggestion */}
              {suggestion && !loading && (
                <motion.div
                  key={suggestion.reply}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.82)' }}>
                    {suggestion.reply}
                  </p>

                  {/* Context tags */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {analysis?.strategy?.level && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}
                      >
                        {analysis.strategy.label || strategyLevel}
                      </span>
                    )}
                    {suggestion.emotion_aware && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(175,82,222,0.1)', border: '1px solid rgba(175,82,222,0.25)', color: '#BF5AF2' }}
                      >
                        {analysis?.emotion?.icon} emotion-aware
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}