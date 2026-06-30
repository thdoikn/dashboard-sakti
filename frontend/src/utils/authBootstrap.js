import { authService } from '../services/auth'
import useAuthStore from '../store/authStore'

// Synthetic profile used in no-auth (testing) mode so the SPA renders fully
// without a real session. Shape mirrors the backend /auth/me/ payload.
const MOCK_USER = {
  id:            0,
  username:      'tester',
  email:         'tester@example.local',
  first_name:    'Test',
  last_name:     'User',
  display_name:  'Test User (No Auth)',
  role:          'superadmin',
  nip:           '',
  jabatan:       '',
  unit_eselon_i:  null,
  unit_eselon_ii: null,
  last_login:    null,
  date_joined:   '2026-01-01T00:00:00+00:00',
  is_active:     true,
}

/**
 * Asks the backend whether login is required (GET /api/auth/config/).
 * In no-auth mode (auth_enabled === false) we clear any stale tokens so axios
 * sends no Authorization header, then seed a mock session so routes render
 * straight to the dashboard. On any error we default to auth-enabled (safe).
 */
export async function bootstrapAuth() {
  try {
    const { auth_enabled } = await authService.getConfig()
    if (auth_enabled === false) {
      useAuthStore.getState().logout()  // drop stale tokens → no Authorization header
      useAuthStore.setState({ authDisabled: true, user: MOCK_USER })
    }
  } catch {
    // network/other error → leave auth enabled (login required)
  }
}
