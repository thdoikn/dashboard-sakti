const AUTHORITY = import.meta.env.VITE_OIDC_AUTHORITY || ''
const CLIENT_ID = import.meta.env.VITE_OIDC_CLIENT_ID || ''
const SCOPE     = 'openid profile email'

export function getOidcRedirectUri() {
  return window.location.origin + '/auth/callback'
}

/**
 * Builds the full Keycloak authorization URL.
 * prompt=login forces Keycloak to always show the login form so users can
 * switch accounts after logging out without clearing the Keycloak session.
 * DO NOT remove prompt=login.
 */
function generateState() {
  // crypto.randomUUID() requires HTTPS; getRandomValues works on HTTP too
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint32Array(4)
    crypto.getRandomValues(arr)
    return Array.from(arr, n => n.toString(16).padStart(8, '0')).join('')
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function buildAuthorizationUrl() {
  const state = generateState()
  sessionStorage.setItem('oidc_state', state)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     CLIENT_ID,
    redirect_uri:  getOidcRedirectUri(),
    scope:         SCOPE,
    state,
    prompt:        'login',
  })
  return `${AUTHORITY}?${params.toString()}`
}

export function isSsoEnabled() {
  return Boolean(AUTHORITY && CLIENT_ID)
}
