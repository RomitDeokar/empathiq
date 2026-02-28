import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '60000')

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
})

API.interceptors.request.use((config) => {
  config.metadata = { startTime: Date.now() }
  return config
})

API.interceptors.response.use(
  (res) => {
    const duration = Date.now() - res.config.metadata.startTime
    if (duration > 5000) {
      console.warn(`[EmpathIQ] Slow request (${duration}ms): ${res.config.url}`)
    }
    return res
  },
  (err) => {
    const msg = err?.response?.data?.detail || err?.message || 'Unknown error'
    const status = err?.response?.status
    if (status >= 500) {
      console.error(`[EmpathIQ] Server error (${status}): ${msg}`)
    }
    return Promise.reject(new Error(msg))
  }
)

export const analyzeMessage = (customerId, message, issueCategory = 'general') =>
  API.post('/analyze', { customer_id: customerId, message, issue_category: issueCategory })

export const getCustomers = () =>
  API.get('/customers')

export const getCustomer = (customerId) =>
  API.get(`/customers/${customerId}`)

export const getHistory = (customerId) =>
  API.get(`/customers/${customerId}/history`)

export const createCustomer = (data) =>
  API.post('/customers', data)

export const deleteCustomer = (customerId) =>
  API.delete(`/customers/${customerId}`)

export const markResolved = (interactionId, resolved) =>
  API.patch(`/interactions/${interactionId}/resolve`, { interaction_id: interactionId, resolved })

export const getDashboard = () =>
  API.get('/dashboard/summary')

export const runSimulation = (scenarioName) =>
  API.post('/simulate', { scenario_name: scenarioName })

export const getScenarios = () =>
  API.get('/simulate/scenarios')

export default API