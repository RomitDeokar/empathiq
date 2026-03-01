import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, Bot, User, X, MessageSquare, Minimize2 } from 'lucide-react'
import { EmotionTag } from './EmotionTag'
import API from '../api/empathiq'

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(90,200,250,0.15)', border: '1px solid rgba(90,200,250,0.25)' }}
      >
        <Bot size={13} style={{ color: '#5AC8FA' }} />
      </div>
      <div
        className="px-4 py-3 rounded-2xl rounded-bl-sm"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: '#5AC8FA' }}
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ChatMessage({ msg }) {
  const isAgent = msg.role === 'agent'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className={`flex items-end gap-2 ${isAgent ? '' : 'flex-row-reverse'}`}
    >
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5"
        style={
          isAgent
            ? { background: 'rgba(90,200,250,0.15)', border: '1px solid rgba(90,200,250,0.25)' }
            : { background: 'rgba(175,82,222,0.15)', border: '1px solid rgba(175,82,222,0.25)' }
        }
      >
        {isAgent
          ? <Bot size={13} style={{ color: '#5AC8FA' }} />
          : <User size={13} style={{ color: '#BF5AF2' }} />
        }
      </div>

      <div className={`flex flex-col gap-1 max-w-[78%] ${isAgent ? 'items-start' : 'items-end'}`}>
        {/* Bubble */}
        <div
          className={`px-4 py-2.5 text-sm leading-relaxed ${
            isAgent ? 'rounded-2xl rounded-bl-sm' : 'rounded-2xl rounded-br-sm'
          }`}
          style={
            isAgent
              ? {
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.85)',
                }
              : {
                  background: 'rgba(175,82,222,0.15)',
                  border: '1px solid rgba(175,82,222,0.25)',
                  color: 'rgba(255,255,255,0.9)',
                }
          }
        >
          {msg.text}
        </div>

        {/* Emotion tag for customer messages */}
        {!isAgent && msg.emotion_label && (
          <EmotionTag
            label={msg.emotion_label}
            color={msg.emotion_color || '#8E8E93'}
            icon={msg.emotion_icon || '😐'}
            size="xs"
          />
        )}

        {/* Method badge for agent messages */}
        {isAgent && msg.method && (
          <span className="text-[9px] text-white/20 px-1">
            {msg.method === 'model' ? '🤖 AI generated' : '📋 Template'}
          </span>
        )}
      </div>
    </motion.div>
  )
}

export function CustomerChat({ customerId, customerName, onAnalysisUpdate }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'agent',
      text: `Hi${customerName ? ` ${customerName.split(' ')[0]}` : ''}! 👋 How can I help you today?`,
      method: 'template',
    }
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [issueCategory, setIssueCategory] = useState('general')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150)
  }, [open])

  const sendMessage = async () => {
    if (!input.trim() || thinking || !customerId) return

    const userMsg = {
      id: Date.now(),
      role: 'customer',
      text: input.trim(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setThinking(true)

    try {
      // Build conversation history for context
      const history = messages.map((m) => ({ role: m.role, text: m.text }))

      const res = await API.post('/chat', {
        customer_id: customerId,
        message: userMsg.text,
        conversation_history: history,
        issue_category: issueCategory,
      })

      const data = res.data

      // Update emotion tag on the customer message
      setMessages((prev) =>
        prev.map((m) =>
          m.id === userMsg.id
            ? {
                ...m,
                emotion_label: data.emotion?.label,
                emotion_color: data.emotion?.color,
                emotion_icon: data.emotion?.icon,
              }
            : m
        )
      )

      // Add agent reply
      const agentMsg = {
        id: Date.now() + 1,
        role: 'agent',
        text: data.reply,
        method: data.method,
      }
      setMessages((prev) => [...prev, agentMsg])

      // Notify parent to update strategy card
      if (onAnalysisUpdate) {
        onAnalysisUpdate({
          emotion: data.emotion,
          sentiment: data.sentiment,
          frustration: data.frustration,
          strategy: data.strategy,
          timestamp: data.timestamp,
          customer_id: customerId,
        })
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'agent',
          text: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
          method: 'error',
        },
      ])
    } finally {
      setThinking(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Floating trigger button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center z-40 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #5AC8FA, #BF5AF2)',
              boxShadow: '0 8px 32px rgba(90,200,250,0.35)',
            }}
          >
            <MessageSquare size={22} className="text-white" />
            {/* Pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: '2px solid rgba(90,200,250,0.4)' }}
              animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="fixed bottom-6 right-6 w-96 z-50 flex flex-col rounded-2xl overflow-hidden"
            style={{
              height: 520,
              background: 'linear-gradient(160deg, #0d0d1c 0%, #090912 100%)',
              border: '1px solid rgba(90,200,250,0.2)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{
                background: 'rgba(90,200,250,0.07)',
                borderBottom: '1px solid rgba(90,200,250,0.15)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(90,200,250,0.2), rgba(175,82,222,0.2))',
                    border: '1px solid rgba(90,200,250,0.3)',
                  }}
                >
                  <Bot size={15} style={{ color: '#5AC8FA' }} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">EmpathIQ Support</div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] text-white/40">AI-powered · emotionally aware</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/8 transition-all"
                >
                  <Minimize2 size={13} />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/8 transition-all"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Category selector */}
            <div
              className="flex gap-1 px-3 py-2 flex-shrink-0 overflow-x-auto"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            >
              {['general', 'billing', 'technical', 'account'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setIssueCategory(cat)}
                  className="text-[10px] px-2 py-1 rounded-full font-medium whitespace-nowrap transition-all"
                  style={{
                    background: issueCategory === cat ? 'rgba(90,200,250,0.15)' : 'rgba(255,255,255,0.04)',
                    border: issueCategory === cat ? '1px solid rgba(90,200,250,0.35)' : '1px solid rgba(255,255,255,0.07)',
                    color: issueCategory === cat ? '#5AC8FA' : 'rgba(255,255,255,0.3)',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} msg={msg} />
              ))}
              {thinking && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div
              className="flex items-end gap-2 p-3 flex-shrink-0"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                disabled={thinking || !customerId}
                placeholder={customerId ? "Type your message…" : "Select a customer first"}
                rows={2}
                className="form-input flex-1 resize-none text-sm"
                style={{ minHeight: 52, maxHeight: 100 }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || thinking || !customerId}
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background: input.trim() && !thinking && customerId
                    ? 'linear-gradient(135deg, #5AC8FA, #BF5AF2)'
                    : 'rgba(255,255,255,0.06)',
                  color: input.trim() && !thinking ? 'white' : 'rgba(255,255,255,0.2)',
                }}
              >
                {thinking
                  ? <Loader2 size={15} className="animate-spin" />
                  : <Send size={15} />
                }
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}