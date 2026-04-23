import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 10_000,
})

api.interceptors.response.use(
  (r) => r,
  (error) => {
    console.error('API error:', error.response?.data ?? error.message)
    return Promise.reject(error)
  }
)

export default api
