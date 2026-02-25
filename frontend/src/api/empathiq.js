import axios from 'axios'

const API = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

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

export const simulateScenario = (scenarioName) =>
  API.post('/simulate', { scenario_name: scenarioName })

export const getDashboard = () =>
  API.get('/dashboard/summary')

export const getScenarios = () =>
  API.get('/scenarios')

export default API
