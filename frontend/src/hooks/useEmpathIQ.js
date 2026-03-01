import { useState, useEffect, useCallback } from 'react'
import {
  getCustomers,
  getHistory,
  analyzeMessage,
  createCustomer,
  deleteCustomer,
  markResolved,
  runSimulation,
} from '../api/empathiq'

export function useEmpathIQ() {
  const [customers, setCustomers] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [history, setHistory] = useState([])
  const [latestAnalysis, setLatestAnalysis] = useState(null)
  const [latestMessage, setLatestMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [simulating, setSimulating] = useState(false)
  const [error, setError] = useState(null)
  const [apiOnline, setApiOnline] = useState(false)

  // ── API health check ──────────────────────────────────────────────
  const checkApi = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8000/health')
      setApiOnline(res.ok)
    } catch {
      setApiOnline(false)
    }
  }, [])

  // ── Load all customers ────────────────────────────────────────────
  const loadCustomers = useCallback(async () => {
    try {
      const res = await getCustomers()
      setCustomers(res.data || [])
    } catch (_) {}
  }, [])

  // ── Select customer & load history ───────────────────────────────
  const selectCustomer = useCallback(async (customer) => {
    setSelectedCustomer(customer)
    setLatestAnalysis(null)
    setLoading(true)
    setError(null)
    try {
      const res = await getHistory(customer.id)
      setHistory(res.data || [])
    } catch (_) {
      setHistory([])
      setError('Failed to load conversation history.')
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Analyze a new message ─────────────────────────────────────────
  const sendMessage = useCallback(async (message, issueCategory = 'general') => {
    if (!selectedCustomer || !message.trim()) return
    setAnalyzing(true)
    setError(null)
    setLatestMessage(message)
    try {
      const res = await analyzeMessage(selectedCustomer.id, message, issueCategory)
      const analysis = res.data

      setLatestAnalysis(analysis)

      const newInteraction = {
        id: Date.now(),
        customer_id: selectedCustomer.id,
        timestamp: analysis.timestamp,
        message,
        emotion_label: analysis.emotion.label,
        emotion_raw: analysis.emotion.raw_emotion,
        emotion_color: analysis.emotion.color,
        emotion_icon: analysis.emotion.icon,
        sentiment_score: analysis.sentiment.score,
        sentiment_label: analysis.sentiment.label,
        frustration_score: analysis.frustration.frustration_score,
        issue_category: issueCategory,
        resolved: false,
        isNew: true,
      }
      setHistory((prev) => [...prev, newInteraction])

      const updatedCustomer = {
        ...selectedCustomer,
        current_frustration_score: analysis.frustration.frustration_score,
        current_churn_probability: analysis.frustration.churn_probability,
        interaction_count: (selectedCustomer.interaction_count || 0) + 1,
      }
      setSelectedCustomer(updatedCustomer)
      setCustomers((prev) =>
        prev.map((c) => (c.id === selectedCustomer.id ? updatedCustomer : c))
      )
    } catch (e) {
      setError(e.message || 'Analysis failed. Check that the backend is running.')
    } finally {
      setAnalyzing(false)
    }
  }, [selectedCustomer])

  // ── Run a demo scenario ───────────────────────────────────────────
  const runScenario = useCallback(async (scenarioName) => {
    setSimulating(true)
    setError(null)
    try {
      const res = await runSimulation(scenarioName)
      const { customer, history: scenarioHistory, analysis } = res.data

      // Build full customer object
      const fullCustomer = {
        ...customer,
        interaction_count: scenarioHistory.length,
      }

      // Update customers list — upsert the demo customer
      setCustomers((prev) => {
        const exists = prev.find((c) => c.id === fullCustomer.id)
        if (exists) {
          return prev.map((c) => (c.id === fullCustomer.id ? fullCustomer : c))
        }
        return [fullCustomer, ...prev]
      })

      // Select the scenario customer
      setSelectedCustomer(fullCustomer)

      // Load full history with isNew flag on last message
      const enrichedHistory = scenarioHistory.map((h, idx) => ({
        ...h,
        isNew: idx === scenarioHistory.length - 1,
      }))
      setHistory(enrichedHistory)

      // Set analysis
      setLatestAnalysis(analysis)
      // Set last message so AgentSuggestion can generate a reply
      if (scenarioHistory.length > 0) {
        setLatestMessage(scenarioHistory[scenarioHistory.length - 1].message)
      }

    } catch (e) {
      setError(e.message || 'Simulation failed.')
    } finally {
      setSimulating(false)
    }
  }, [])

  // ── Add a new customer ────────────────────────────────────────────
  const addCustomer = useCallback(async (data) => {
    try {
      const res = await createCustomer(data)
      const newCustomer = { ...res.data, interaction_count: 0 }
      setCustomers((prev) => [newCustomer, ...prev])
      return { success: true, customer: newCustomer }
    } catch (e) {
      return { success: false, error: e.message }
    }
  }, [])

  // ── Delete a customer ─────────────────────────────────────────────
  const removeCustomer = useCallback(async (customerId) => {
    try {
      await deleteCustomer(customerId)
      setCustomers((prev) => prev.filter((c) => c.id !== customerId))
      if (selectedCustomer?.id === customerId) {
        setSelectedCustomer(null)
        setHistory([])
        setLatestAnalysis(null)
      }
      return { success: true }
    } catch (e) {
      return { success: false, error: e.message }
    }
  }, [selectedCustomer])

  // ── Toggle resolved ───────────────────────────────────────────────
  const toggleResolved = useCallback(async (interactionId, resolved) => {
    try {
      await markResolved(interactionId, resolved)
      setHistory((prev) =>
        prev.map((i) => (i.id === interactionId ? { ...i, resolved } : i))
      )
    } catch (_) {
      setError('Failed to update ticket status.')
    }
  }, [])

  // ── Lifecycle ─────────────────────────────────────────────────────
  useEffect(() => {
    checkApi()
    const interval = setInterval(checkApi, 5000)
    return () => clearInterval(interval)
  }, [checkApi])

  useEffect(() => {
    if (apiOnline) loadCustomers()
  }, [apiOnline]) // eslint-disable-line

  return {
    customers, selectedCustomer, history, latestAnalysis, latestMessage,
    loading, analyzing, simulating, error, apiOnline,
    selectCustomer, sendMessage, runScenario,
    addCustomer, removeCustomer, toggleResolved,
    loadCustomers, setError,
  }
}