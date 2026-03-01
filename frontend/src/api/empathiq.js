import axios from 'axios'

const API = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
})

API.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err?.response?.data?.detail || err?.message || 'Unknown error'
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

// Chatbot endpoints
export const customerChat = (customerId, message, conversationHistory = [], issueCategory = 'general') =>
  API.post('/chat', {
    customer_id: customerId,
    message,
    conversation_history: conversationHistory,
    issue_category: issueCategory,
  })

export const generateAgentReply = (customerId, message, strategyLevel, emotionRaw, frustrationScore, issueCategory = 'general') =>
  API.post('/generate-reply', {
    customer_id: customerId,
    message,
    strategy_level: strategyLevel,
    emotion_raw: emotionRaw,
    frustration_score: frustrationScore,
    issue_category: issueCategory,
  })

export default API