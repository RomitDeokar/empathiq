import React, { useState, useRef } from 'react'
import { Send, Loader2 } from 'lucide-react'
import clsx from 'clsx'

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'billing', label: 'Billing' },
  { value: 'technical', label: 'Technical' },
  { value: 'product_bug', label: 'Product Bug' },
  { value: 'account', label: 'Account' },
  { value: 'cancellation', label: 'Cancellation' },
]

export function MessageInput({ onSend, analyzing, disabled }) {
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState('general')
  const textareaRef = useRef(null)

  const handleSend = () => {
    const trimmed = message.trim()
    if (!trimmed || analyzing || disabled) return
    onSend(trimmed, category)
    setMessage('')
    textareaRef.current?.focus()
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className="border-t p-4 space-y-3"
      style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' }}
    >
      {/* Category row */}
      <div className="flex gap-1.5 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={clsx(
              'text-xs px-2.5 py-1 rounded-full transition-all duration-150 font-medium',
              category === cat.value
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                : 'bg-white/4 text-white/35 border border-white/8 hover:bg-white/8 hover:text-white/60'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="flex gap-2.5 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={handleKey}
            placeholder={disabled ? "Select a customer first..." : "Type a customer message... (Enter to send)"}
            disabled={disabled || analyzing}
            rows={2}
            className={clsx(
              'w-full resize-none rounded-xl px-4 py-3 text-sm text-white/85',
              'placeholder-white/25 transition-all duration-200 outline-none',
              'focus:ring-1 focus:ring-sky-500/40',
              disabled ? 'opacity-40 cursor-not-allowed' : ''
            )}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!message.trim() || analyzing || disabled}
          className={clsx(
            'w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0',
            message.trim() && !analyzing && !disabled
              ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/30'
              : 'bg-white/6 text-white/25 cursor-not-allowed'
          )}
        >
          {analyzing
            ? <Loader2 size={16} className="animate-spin" />
            : <Send size={16} />
          }
        </button>
      </div>
      <div className="text-white/20 text-xs">
        Shift+Enter for new line · Enter to analyze
      </div>
    </div>
  )
}
