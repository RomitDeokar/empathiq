import React, { useState, useRef } from 'react'
import { Send, Loader2 } from 'lucide-react'
import clsx from 'clsx'

const CATEGORIES = [
  { value: 'general',      label: 'General'     },
  { value: 'billing',      label: 'Billing'     },
  { value: 'technical',    label: 'Technical'   },
  { value: 'product_bug',  label: 'Bug Report'  },
  { value: 'account',      label: 'Account'     },
  { value: 'cancellation', label: 'Cancellation'},
]

export function MessageInput({ onSend, analyzing, disabled }) {
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState('general')
  const textareaRef = useRef(null)

  const canSend = message.trim().length > 0 && !analyzing && !disabled

  const handleSend = () => {
    if (!canSend) return
    onSend(message.trim(), category)
    setMessage('')
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className="flex flex-col gap-2.5 p-3 border-t"
      style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.25)' }}
    >
      {/* Category chips */}
      <div className="flex gap-1 flex-wrap">
        {CATEGORIES.map((cat) => {
          const active = category === cat.value
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              disabled={disabled}
              className="text-[11px] px-2 py-0.5 rounded-full font-medium transition-all duration-100"
              style={{
                background: active ? 'rgba(90,200,250,0.15)' : 'rgba(255,255,255,0.04)',
                border: active ? '1px solid rgba(90,200,250,0.35)' : '1px solid rgba(255,255,255,0.07)',
                color: active ? '#5AC8FA' : 'rgba(255,255,255,0.3)',
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Textarea + send button */}
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || analyzing}
            placeholder={
              disabled
                ? 'Select a customer to begin…'
                : 'Paste or type a customer message…'
            }
            rows={2}
            className="form-input resize-none"
            style={{ paddingRight: '12px', minHeight: '64px' }}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!canSend}
          className={clsx(
            'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150',
            canSend
              ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-md shadow-sky-500/25 hover:scale-105 active:scale-95'
              : 'bg-white/5 text-white/20 cursor-not-allowed'
          )}
          title="Send (Enter)"
        >
          {analyzing
            ? <Loader2 size={15} className="animate-spin" />
            : <Send size={15} />
          }
        </button>
      </div>

      <p className="text-[10px] text-white/20">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  )
}
