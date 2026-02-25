import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Zap, AlertCircle, RefreshCw, Wifi, WifiOff, Play, ChevronRight } from 'lucide-react'
import { CustomerList } from '../components/CustomerList'
import { ChatFeed } from '../components/ChatFeed'
import { StrategyCard } from '../components/StrategyCard'
import { FrustrationChart } from '../components/FrustrationChart'
import { MessageInput } from '../components/MessageInput'
import { useEmpathIQ } from '../hooks/useEmpathIQ'
import clsx from 'clsx'

const SCENARIOS = [
  {
    id: 'escalating',
    label: 'The Escalator',
    emoji: '⚡',
    desc: '4th ticket, same billing issue. Score builds in real-time.',
    color: '#FF9F0A',
  },
  {
    id: 'first_timer',
    label: 'First Timer',
    emoji: '👋',
    desc: 'New confused user. Low risk — gentle strategy fires.',
    color: '#34C759',
  },
  {
    id: 'silent_churner',
    label: 'Silent Churner',
    emoji: '🔇',
    desc: 'Went quiet 18 days, now back cold. Most dramatic demo.',
    color: '#FF2D55',
  },
]

function TopBar({ apiOnline, onRefresh, loading }) {
  return (
    <div
      className="flex items-center justify-between px-6 py-4 border-b"
      style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(5,5,8,0.9)', backdropFilter: 'blur(12px)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
          style={{ background: 'linear-gradient(135deg, rgba(90,200,250,0.2), rgba(175,82,222,0.2))', border: '1px solid rgba(90,200,250,0.3)' }}
        >
          🧠
        </div>
        <div>
          <div className="font-black text-lg text-white tracking-tight">EmpathIQ</div>
          <div className="text-xs text-white/35 -mt-0.5">Emotional Intelligence Middleware</div>
        </div>
      </div>

      {/* Center — scenarios */}
      <div className="hidden md:flex items-center gap-1.5 bg-white/4 rounded-xl p-1.5 border border-white/6">
        <span className="text-white/30 text-xs px-2">Demo:</span>
        {SCENARIOS.map(s => (
          <ScenarioChip key={s.id} scenario={s} loading={loading} />
        ))}
      </div>

      {/* Right — status */}
      <div className="flex items-center gap-3">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/6 transition-all"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {apiOnline
            ? <><Wifi size={12} className="text-green-400" /><span className="text-green-400 text-xs font-medium">API Live</span></>
            : <><WifiOff size={12} className="text-red-400" /><span className="text-red-400 text-xs font-medium">API Offline</span></>
          }
        </div>
      </div>
    </div>
  )
}

function ScenarioChip({ scenario, loading }) {
  const { runScenario } = useEmpathIQ()
  // We need to pass runScenario from the parent — see usage in Dashboard
  return null // Placeholder, handled in Dashboard directly
}

export default function Dashboard() {
  const {
    customers, selectedCustomer, history, latestAnalysis,
    loading, analyzing, error, apiOnline,
    selectCustomer, sendMessage, runScenario, loadCustomers, setError
  } = useEmpathIQ()

  const [activePanel, setActivePanel] = useState('all') // mobile nav

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#050508' }}>
      {/* Top Bar */}
      <div
        className="flex items-center justify-between px-6 py-3.5 border-b flex-shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(8,8,12,0.95)', backdropFilter: 'blur(12px)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'linear-gradient(135deg, rgba(90,200,250,0.2), rgba(175,82,222,0.2))', border: '1px solid rgba(90,200,250,0.25)' }}
          >
            🧠
          </div>
          <div>
            <span className="font-black text-xl text-white tracking-tight">EmpathIQ</span>
            <span className="text-white/30 text-xs ml-2.5 hidden sm:inline">Emotional Context Layer</span>
          </div>
        </div>

        {/* Demo Scenarios */}
        <div className="flex items-center gap-1.5">
          <span className="text-white/25 text-xs mr-1 hidden sm:block">Demo →</span>
          {SCENARIOS.map(s => (
            <button
              key={s.id}
              onClick={() => runScenario(s.id)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 hover:scale-105 active:scale-95"
              style={{
                background: `${s.color}10`,
                border: `1px solid ${s.color}30`,
                color: s.color,
              }}
              title={s.desc}
            >
              <span>{s.emoji}</span>
              <span className="hidden sm:block">{s.label}</span>
            </button>
          ))}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <button
            onClick={loadCustomers}
            disabled={loading}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className={clsx('w-1.5 h-1.5 rounded-full', apiOnline ? 'bg-green-400' : 'bg-red-400')}
              style={{ boxShadow: apiOnline ? '0 0 6px #34C759' : '0 0 6px #FF3B30' }}
            />
            <span className={apiOnline ? 'text-green-400' : 'text-red-400'}>
              {apiOnline ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden flex-shrink-0"
          >
            <div className="flex items-center gap-3 px-6 py-2.5 bg-red-500/10 border-b border-red-500/20">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
              <span className="text-red-400/90 text-xs flex-1">{error}</span>
              <button onClick={() => setError(null)} className="text-red-400/50 hover:text-red-400 text-xs px-2 py-0.5">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* API Offline Notice */}
      {!apiOnline && (
        <div className="flex items-center justify-center gap-3 px-6 py-3 bg-orange-500/8 border-b border-orange-500/15 flex-shrink-0">
          <span className="text-orange-400/80 text-xs">
            ⚡ Start the FastAPI backend: <code className="bg-white/8 px-1.5 py-0.5 rounded text-orange-300 font-mono">cd backend && uvicorn main:app --reload</code>
          </span>
        </div>
      )}

      {/* Three-Panel Layout */}
      <div className="flex-1 grid grid-cols-[280px_1fr_340px] overflow-hidden min-h-0">

        {/* ── Panel 1: Customer List ──────────────────────────────── */}
        <div
          className="flex flex-col border-r overflow-hidden"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        >
          {/* Panel Header */}
          <div
            className="px-4 py-3 flex items-center justify-between border-b flex-shrink-0"
            style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}
          >
            <div className="flex items-center gap-2">
              <Users size={14} className="text-white/40" />
              <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">Customers</span>
            </div>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'rgba(90,200,250,0.1)', color: '#5AC8FA', border: '1px solid rgba(90,200,250,0.2)' }}
            >
              {customers.length}
            </span>
          </div>

          {/* Customer Scroll List */}
          <div className="flex-1 overflow-y-auto">
            <CustomerList
              customers={customers}
              selectedCustomer={selectedCustomer}
              onSelect={selectCustomer}
            />
          </div>

          {/* Frustration Chart for Selected Customer */}
          {selectedCustomer && history.length >= 2 && (
            <div
              className="border-t p-3 flex-shrink-0"
              style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}
            >
              <div className="text-xs text-white/30 uppercase tracking-wider mb-2 px-1">Score Trajectory</div>
              <FrustrationChart history={history} />
            </div>
          )}
        </div>

        {/* ── Panel 2: Chat Feed ─────────────────────────────────── */}
        <div className="flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div
            className="px-4 py-3 flex items-center justify-between border-b flex-shrink-0"
            style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}
          >
            {selectedCustomer ? (
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    background: `${selectedCustomer.avatar_color}22`,
                    border: `1.5px solid ${selectedCustomer.avatar_color}44`,
                    color: selectedCustomer.avatar_color,
                  }}
                >
                  {selectedCustomer.name[0].toUpperCase()}
                </div>
                <div>
                  <div className="text-white/90 text-sm font-semibold">{selectedCustomer.name}</div>
                  <div className="text-white/35 text-xs">{selectedCustomer.email}</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-white/30 text-xs">
                <span>👆</span>
                <span>Select a customer from the left panel</span>
              </div>
            )}
            {selectedCustomer && (
              <div className="flex items-center gap-1.5">
                <span className={clsx('tier-badge',
                  selectedCustomer.plan_tier === 'enterprise' ? 'tier-enterprise' :
                  selectedCustomer.plan_tier === 'pro' ? 'tier-pro' : 'tier-standard'
                )}>
                  {selectedCustomer.plan_tier}
                </span>
              </div>
            )}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto">
            {loading && !analyzing ? (
              <div className="flex items-center justify-center h-full gap-3 text-white/30">
                <RefreshCw size={16} className="animate-spin" />
                <span className="text-sm">Loading history...</span>
              </div>
            ) : (
              <ChatFeed
                history={history}
                analyzing={analyzing}
                customerName={selectedCustomer?.name}
              />
            )}
          </div>

          {/* Message Input */}
          <div className="flex-shrink-0">
            <MessageInput
              onSend={sendMessage}
              analyzing={analyzing}
              disabled={!selectedCustomer || !apiOnline}
            />
          </div>
        </div>

        {/* ── Panel 3: Strategy Card ─────────────────────────────── */}
        <div
          className="flex flex-col overflow-hidden border-l"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        >
          {/* Panel Header */}
          <div
            className="px-4 py-3 flex items-center gap-2 border-b flex-shrink-0"
            style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}
          >
            <Zap size={14} className="text-sky-400/70" />
            <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">
              Strategy Card
            </span>
            {latestAnalysis && (
              <div
                className="ml-auto text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(52,199,89,0.1)', color: '#34C759', border: '1px solid rgba(52,199,89,0.2)' }}
              >
                Live
              </div>
            )}
          </div>

          {/* Strategy Card Content */}
          <div className="flex-1 overflow-hidden p-3">
            <div className="h-full overflow-y-auto">
              <StrategyCard analysis={latestAnalysis} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
