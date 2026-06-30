import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user:         null,
  accessToken:  localStorage.getItem('access_token')  || null,
  refreshToken: localStorage.getItem('refresh_token') || null,
  // When true, the backend has auth disabled (testing mode) — no login required.
  authDisabled: false,
  isLoading:    false,

  setAuth: ({ user, access, refresh }) => {
    localStorage.setItem('access_token',  access)
    localStorage.setItem('refresh_token', refresh)
    set({ user, accessToken: access, refreshToken: refresh })
  },

  setUser:         (user)         => set({ user }),
  setLoading:      (isLoading)     => set({ isLoading }),
  setAuthDisabled: (authDisabled)  => set({ authDisabled }),

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ user: null, accessToken: null, refreshToken: null })
  },
}))

export default useAuthStore
