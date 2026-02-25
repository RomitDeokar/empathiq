import { useState, useEffect, useCallback, useRef } from 'react'
import { getCustomers, getHistory, simulateScenario, analyzeMessage, createCustomer } from '../api/empathiq'

export function useEmpathIQ() {
  const [customers, setCustomers] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [history, setHistory] = useState([])
  const [latestAnalysis, setLatestAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState(null)
  const [apiOnline, setApiOnline] = useState(false)

  const checkApi = useCallback(async () => {
    try {
      await fetch('http://localhost:8000/health')
      setApiOnline(true)
    } catch {
      setApiOnline(false)
    }
  }, [])

  const loadCustomers = useCallback(async () => {
    try {
      const res = await getCustomers()
      setCustomers(res.data)
    } catch (e) {
      setError('Failed to load customers')
    }
  }, [])

  const selectCustomer = useCallback(async (customer) => {
    setSelectedCustomer(customer)
    setLatestAnalysis(null)
    setLoading(true)
    try {
      const res = await getHistory(customer.id)
      setHistory(res.data || [])
    } catch (e) {
      setHistory([])
    } finally {
      setLoading(false)
    }
  }, [])

  const sendMessage = useCallback(async (message, issueCategory = 'general') => {
    if (!selectedCustomer || !message.trim()) return
    setAnalyzing(true)
    try {
      const res = await analyzeMessage(selectedCustomer.id, message, issueCategory)
      const analysis = res.data
      setLatestAnalysis(analysis)
      
      // Add new interaction to history (optimistic update)
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
      setHistory(prev => [...prev, newInteraction])

      // Update customer score in list
      setCustomers(prev => prev.map(c =>
        c.id === selectedCustomer.id
          ? { ...c,
              current_frustration_score: analysis.frustration.frustration_score,
              current_churn_probability: analysis.frustration.churn_probability,
              interaction_count: (c.interaction_count || 0) + 1,
            }
          : c
      ))

      setSelectedCustomer(prev => prev ? {
        ...prev,
        current_frustration_score: analysis.frustration.frustration_score,
        current_churn_probability: analysis.frustration.churn_probability,
      } : prev)

    } catch (e) {
      setError(e?.response?.data?.detail || 'Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }, [selectedCustomer])

  const runScenario = useCallback(async (scenarioName) => {
    setLoading(true)
    setLatestAnalysis(null)
    setError(null)
    try {
      const res = await simulateScenario(scenarioName)
      const analysis = res.data
      setLatestAnalysis(analysis)

      // Reload everything
      await loadCustomers()

      const custRes = await getHistory(analysis.customer_id)
      setHistory(custRes.data || [])

      // Find and select the customer
      const custListRes = await getCustomers()
      const found = custListRes.data.find(c => c.id === analysis.customer_id)
      if (found) setSelectedCustomer(found)

    } catch (e) {
      setError(e?.response?.data?.detail || 'Simulation failed')
    } finally {
      setLoading(false)
    }
  }, [loadCustomers])

  useEffect(() => {
    checkApi()
    const interval = setInterval(checkApi, 5000)
    return () => clearInterval(interval)
  }, [checkApi])

  useEffect(() => {
    if (apiOnline) {
      loadCustomers()
    }
  }, [apiOnline, loadCustomers])

  return {
    customers,
    selectedCustomer,
    history,
    latestAnalysis,
    loading,
    analyzing,
    error,
    apiOnline,
    selectCustomer,
    sendMessage,
    runScenario,
    loadCustomers,
    setError,
  }
}
