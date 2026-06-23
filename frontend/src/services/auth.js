import apiClient from '../api/client'

export const authService = {
  oidcCallback: (code, redirectUri) =>
    apiClient.post('/auth/oidc/callback/', { code, redirect_uri: redirectUri }).then(r => r.data),

  refreshToken: (refresh) =>
    apiClient.post('/auth/token/refresh/', { refresh }).then(r => r.data),

  getMe: () =>
    apiClient.get('/auth/me/').then(r => r.data),
}
