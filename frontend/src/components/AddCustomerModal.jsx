import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UserPlus, Loader2 } from 'lucide-react'

const AVATAR_COLORS = [
  '#5AC8FA', '#30D158', '#FF9F0A', '#FF6B35',
  '#BF5AF2', '#FF375F', '#64D2FF', '#FFD60A',
]

const TIERS = [
  { value: 'free',       label: 'Free',       desc: 'Basic plan' },
  { value: 'standard',   label: 'Standard',   desc: 'Most common' },
  { value: 'pro',        label: 'Pro',        desc: 'Power users' },
  { value: 'enterprise', label: 'Enterprise', desc: 'High-value' },
]

export function AddCustomerModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    plan_tier: 'standard',
    avatar_color: '#5AC8FA',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email'
    return e
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    setSubmitting(true)
    setApiError('')
    const result = await onAdd({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      plan_tier: form.plan_tier,
      avatar_color: form.avatar_color,
    })
    setSubmitting(false)

    if (result.success) {
      onClose()
    } else {
      setApiError(result.error || 'Failed to create customer.')
    }
  }

  const set = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }))
    setErrors((p) => ({ ...p, [key]: undefined }))
  }

  // Close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleBackdrop}>
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 16 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0e0e1c 0%, #0a0a14 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(90,200,250,0.12)', border: '1px solid rgba(90,200,250,0.25)' }}
            >
              <UserPlus size={15} style={{ color: '#5AC8FA' }} />
            </div>
            <div>
              <div className="text-white font-semibold text-sm">Add Customer</div>
              <div className="text-white/35 text-xs">Create a new support profile</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/8 transition-all"
          >
            <X size={14} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* API error */}
          <AnimatePresence>
            {apiError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5"
              >
                {apiError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Full Name</label>
            <input
              className="form-input"
              placeholder="e.g. Sarah Johnson"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              disabled={submitting}
              autoFocus
            />
            {errors.name && <p className="text-red-400 text-xs">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="sarah@company.com"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              disabled={submitting}
            />
            {errors.email && <p className="text-red-400 text-xs">{errors.email}</p>}
          </div>

          {/* Plan Tier */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Plan Tier</label>
            <div className="grid grid-cols-4 gap-1.5">
              {TIERS.map((tier) => (
                <button
                  key={tier.value}
                  type="button"
                  onClick={() => set('plan_tier', tier.value)}
                  disabled={submitting}
                  className="flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all duration-150"
                  style={{
                    background: form.plan_tier === tier.value ? 'rgba(90,200,250,0.1)' : 'rgba(255,255,255,0.03)',
                    borderColor: form.plan_tier === tier.value ? 'rgba(90,200,250,0.4)' : 'rgba(255,255,255,0.07)',
                  }}
                >
                  <span className="text-xs font-semibold text-white/80">{tier.label}</span>
                  <span className="text-white/30 text-[10px]">{tier.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Avatar Color */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Color</label>
            <div className="flex gap-2 flex-wrap">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => set('avatar_color', color)}
                  disabled={submitting}
                  className="w-7 h-7 rounded-full transition-all duration-150 flex items-center justify-center"
                  style={{
                    background: color,
                    boxShadow: form.avatar_color === color ? `0 0 0 2px rgba(0,0,0,0.8), 0 0 0 4px ${color}` : 'none',
                    transform: form.avatar_color === color ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}

              {/* Preview */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ml-auto"
                style={{
                  background: `${form.avatar_color}22`,
                  border: `2px solid ${form.avatar_color}55`,
                  color: form.avatar_color,
                }}
              >
                {form.name ? form.name[0].toUpperCase() : '?'}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={submitting}>
              {submitting ? (
                <><Loader2 size={14} className="animate-spin" /> Creating...</>
              ) : (
                <><UserPlus size={14} /> Add Customer</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
