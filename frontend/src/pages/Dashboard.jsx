import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Zap, AlertCircle, RefreshCw, UserPlus,
  BarChart2, Brain, Play, ChevronRight, Loader2,
} from 'lucide-react'
import { CustomerList }      from '../components/CustomerList'
import { ChatFeed }          from '../components/ChatFeed'
import { StrategyCard }      from '../components/StrategyCard'
import { FrustrationChart }  from '../components/FrustrationChart'
import { MessageInput }      from '../components/MessageInput'
import { AddCustomerModal }  from '../components/AddCustomerModal'
import { FrustrationBadge }  from '../components/FrustrationBadge'
import { CustomerChat }      from '../components/CustomerChat'
import { AgentSuggestion }   from '../components/AgentSuggestion'
import { useEmpathIQ }       from '../hooks/useEmpathIQ'
import clsx from 'clsx'

// ─── Scenario config ──────────────────────────────────────────────────────────

const SCENARIOS = [
  {
    name: 'escalating',
    label: 'The Escalator',
    icon: '⚡',
    desc: '4th billing ticket',
    score: '8.4',
    urgency: 'CRITICAL',
    color: '#FF6B35',
    bg: 'rgba(255,107,53,0.08)',
    border: 'rgba(255,107,53,0.25)',
  },
  {
    name: 'first_timer',
    label: 'First Timer',
    icon: '👋',
    desc: 'New user, calm',
    score: '2.1',
    urgency: 'LOW',
    color: '#30D158',
    bg: 'rgba(48,209,88,0.08)',
    border: 'rgba(48,209,88,0.25)',
  },
  {
    name: 'silent_churner',
    label: 'Silent Churner',
    icon: '🔇',
    desc: '18 days gone, back cold',
    score: '9.1',
    urgency: 'EMERGENCY',
    color: '#FF375F',
    bg: 'rgba(255,55,95,0.08)',
    border: 'rgba(255,55,95,0.25)',
  },
]

// ─── Sub-components ──────────────────────────────────────────────────────────

function ScenarioBar({ onSimulate, simulating }) {
  const [active, setActive] = useState(null)

  const handleClick = (scenarioName) => {
    if (simulating) return
    setActive(scenarioName)
    onSimulate(scenarioName)
  }

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 border-b flex-shrink-0"
      style={{
        borderColor: 'rgba(255,255,255,0.06)',
        background: 'rgba(0,0,0,0.3)',
      }}
    >
      <div className="flex items-center gap-1.5 mr-2">
        <Play size={10} className="text-white/30" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
          Demo
        </span>
      </div>

      <div className="flex gap-1.5 flex-1">
        {SCENARIOS.map((s) => {
          const isRunning = simulating && active === s.name
          return (
            <motion.button
              key={s.name}
              onClick={() => handleClick(s.name)}
              disabled={simulating}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-1 justify-center"
              style={{
                background: s.bg,
                border: `1px solid ${s.border}`,
                color: s.color,
                cursor: simulating ? 'not-allowed' : 'pointer',
                opacity: simulating && active !== s.name ? 0.45 : 1,
              }}
            >
              {isRunning ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <span className="text-sm leading-none">{s.icon}</span>
              )}
              <span className="hidden sm:inline">{s.label}</span>
              <span
                className="text-[9px] font-bold px-1 py-0.5 rounded"
                style={{ background: `${s.color}20`, color: s.color }}
              >
                ~{s.score}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

function TopBar({ apiOnline, loading, onRefresh, onAddCustomer }) {
  return (
    <header
      className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0"
      style={{
        borderColor: 'rgba(255,255,255,0.06)',
        background: 'rgba(6,6,10,0.97)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(90,200,250,0.18), rgba(175,82,222,0.18))',
            border: '1px solid rgba(90,200,250,0.22)',
          }}
        >
          <Brain size={16} style={{ color: '#5AC8FA' }} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-black text-base text-white tracking-tight">EmpathIQ</span>
            <span
              className="text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(90,200,250,0.1)', color: 'rgba(90,200,250,0.7)' }}
            >
              v2
            </span>
          </div>
          <div className="text-[10px] text-white/25 hidden md:block">
            Emotional Context Layer for Customer Support
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="btn-ghost py-1.5 px-2.5"
          title="Refresh"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
        <button onClick={onAddCustomer} className="btn-primary py-1.5 px-3 text-xs">
          <UserPlus size={13} />
          <span className="hidden sm:inline">Add Customer</span>
        </button>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className={clsx('status-dot', apiOnline ? 'online' : 'offline')} />
          <span className={apiOnline ? 'text-green-400' : 'text-red-400'}>
            {apiOnline ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>
    </header>
  )
}

function PanelHeader({ icon: Icon, label, right, iconColor = '#8E8E93' }) {
  return (
    <div className="panel-header">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Icon size={13} style={{ color: iconColor, flexShrink: 0 }} />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50 truncate">
          {label}
        </span>
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
  )
}

function OfflineBanner() {
  return (
    <div
      className="flex items-center justify-center gap-3 px-5 py-2 border-b flex-shrink-0"
      style={{ background: 'rgba(255,149,0,0.07)', borderColor: 'rgba(255,149,0,0.15)' }}
    >
      <span className="text-[11px] text-orange-400/80">
        ⚡ Backend not running —{' '}
        <code className="ml-1 bg-white/8 px-1.5 py-0.5 rounded font-mono text-orange-300">
          cd backend &amp;&amp; uvicorn main:app --reload
        </code>
      </span>
    </div>
  )
}

function ErrorBanner({ error, onDismiss }) {
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden flex-shrink-0"
        >
          <div
            className="flex items-center gap-3 px-5 py-2 border-b"
            style={{ background: 'rgba(255,59,48,0.08)', borderColor: 'rgba(255,59,48,0.18)' }}
          >
            <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
            <span className="text-red-400/90 text-xs flex-1">{error}</span>
            <button onClick={onDismiss} className="text-red-400/40 hover:text-red-400 text-sm px-1">✕</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const {
    customers, selectedCustomer, history, latestAnalysis, latestMessage,
    loading, analyzing, error, apiOnline,
    selectCustomer, sendMessage, addCustomer, removeCustomer,
    toggleResolved, loadCustomers, setError,
    runScenario, simulating,
  } = useEmpathIQ()

  const [showAddModal, setShowAddModal] = useState(false)

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#050508' }}>

      <TopBar
        apiOnline={apiOnline}
        loading={loading}
        onRefresh={loadCustomers}
        onAddCustomer={() => setShowAddModal(true)}
      />

      {/* Scenario buttons bar */}
      <ScenarioBar onSimulate={runScenario} simulating={simulating} />

      <ErrorBanner error={error} onDismiss={() => setError(null)} />
      {!apiOnline && <OfflineBanner />}

      {/* Three-panel layout */}
      <div className="flex-1 overflow-hidden grid min-h-0" style={{ gridTemplateColumns: '272px 1fr 332px' }}>

        {/* Panel 1 — Customers */}
        <div className="flex flex-col overflow-hidden border-r" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <PanelHeader
            icon={Users}
            label="Customers"
            iconColor="#5AC8FA"
            right={
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(90,200,250,0.1)', color: '#5AC8FA', border: '1px solid rgba(90,200,250,0.2)' }}
                >
                  {customers.length}
                </span>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-white/40 hover:text-sky-400 hover:bg-sky-500/10 transition-all"
                >
                  <UserPlus size={12} />
                </button>
              </div>
            }
          />

          <div className="flex-1 overflow-y-auto">
            <CustomerList
              customers={customers}
              selectedCustomer={selectedCustomer}
              onSelect={selectCustomer}
              onDelete={removeCustomer}
            />
          </div>

          {selectedCustomer && history.length >= 2 && (
            <div
              className="border-t flex-shrink-0 p-3"
              style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.18)' }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <BarChart2 size={11} className="text-white/30" />
                <span className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">
                  Score Trajectory
                </span>
              </div>
              <FrustrationChart history={history} />
            </div>
          )}
        </div>

        {/* Panel 2 — Chat */}
        <div className="flex flex-col overflow-hidden">
          <div className="panel-header" style={{ minHeight: 44 }}>
            {selectedCustomer ? (
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                  style={{
                    background: `${selectedCustomer.avatar_color}20`,
                    border: `1.5px solid ${selectedCustomer.avatar_color}40`,
                    color: selectedCustomer.avatar_color,
                  }}
                >
                  {selectedCustomer.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white/90 truncate">
                      {selectedCustomer.name}
                    </span>
                    <span className={clsx('tier-badge', {
                      'tier-enterprise': selectedCustomer.plan_tier === 'enterprise',
                      'tier-pro': selectedCustomer.plan_tier === 'pro',
                      'tier-standard': selectedCustomer.plan_tier === 'standard',
                      'tier-free': selectedCustomer.plan_tier === 'free',
                    })}>
                      {selectedCustomer.plan_tier}
                    </span>
                  </div>
                  <div className="text-[10px] text-white/30 truncate">{selectedCustomer.email}</div>
                </div>
                {selectedCustomer.current_frustration_score > 0 && (
                  <FrustrationBadge score={selectedCustomer.current_frustration_score} size="sm" />
                )}
              </div>
            ) : (
              <span className="text-xs text-white/25 flex items-center gap-2">
                <span>←</span>
                <span>Select a customer or run a demo scenario above</span>
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && !analyzing ? (
              <div className="flex items-center justify-center h-full gap-2.5 text-white/25">
                <RefreshCw size={14} className="animate-spin" />
                <span className="text-sm">Loading history…</span>
              </div>
            ) : (
              <ChatFeed
                history={history}
                analyzing={analyzing || simulating}
                customerName={selectedCustomer?.name}
                onToggleResolved={toggleResolved}
              />
            )}
          </div>

          <MessageInput
            onSend={sendMessage}
            analyzing={analyzing || simulating}
            disabled={!selectedCustomer || !apiOnline}
          />
        </div>

        {/* Panel 3 — Strategy Card */}
        <div className="flex flex-col overflow-hidden border-l" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <PanelHeader
            icon={Zap}
            label="Strategy Card"
            iconColor="#5AC8FA"
            right={
              latestAnalysis ? (
                <motion.span
                  key="live"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(48,209,88,0.1)',
                    color: '#30D158',
                    border: '1px solid rgba(48,209,88,0.2)',
                  }}
                >
                  <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                  Live
                </motion.span>
              ) : null
            }
          />
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
            <StrategyCard analysis={latestAnalysis} simulating={simulating} />
            <AgentSuggestion
              customerId={selectedCustomer?.id}
              latestMessage={latestMessage}
              analysis={latestAnalysis}
            />
          </div>
        </div>
      </div>

      {/* Customer-facing chat widget */}
      <CustomerChat
        customerId={selectedCustomer?.id}
        customerName={selectedCustomer?.name}
      />

      <AnimatePresence>
        {showAddModal && (
          <AddCustomerModal
            onClose={() => setShowAddModal(false)}
            onAdd={addCustomer}
          />
        )}
      </AnimatePresence>
    </div>
  )
}