import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT access token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear auth and redirect to login
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      // Avoid circular import: manipulate store state via localStorage wipe,
      // the store reads from localStorage on init so a page redirect is enough.
      window.location.replace('/login')
    }
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  },
)

export default apiClient
