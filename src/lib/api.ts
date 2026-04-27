import axios from 'axios'
import { APP_CONFIG } from '@/types/auth'
import { useAuthStore } from '@/store/authStore'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// Garante barra final em toda URL (Django exige APPEND_SLASH)
api.interceptors.request.use((config) => {
  if (config.url && !config.url.endsWith('/') && !config.url.includes('?')) {
    config.url = config.url + '/'
  }
  if (['post', 'put', 'patch', 'delete'].includes(config.method ?? '')) {
    const csrf = document.cookie
      .split('; ')
      .find((c) => c.startsWith('csrftoken='))
      ?.split('=')[1]
    if (csrf) config.headers['X-CSRFToken'] = csrf
  }
  return config
})

// Redireciona para o login da app correta em caso de 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLogout = error.config?.url?.includes('/accounts/logout')
    if (!isLogout && error.response?.status === 401) {
      // Ler appContext da store fora de hook (Zustand permite acesso direto ao estado)
      const appContext = useAuthStore.getState().appContext

      if (appContext) {
        const { loginPath } = APP_CONFIG[appContext]
        useAuthStore.getState().clearAuth()
        // Redirecionar apenas se não estiver já na página de login
        if (!window.location.pathname.includes('/login')) {
          window.location.href = `${loginPath}?reason=session_expired`
        }
      } else {
        // Fallback: appContext ainda não estava na store (ex: erro na própria chamada /me)
        // Detecta o app pelo pathname atual
        const pathname = window.location.pathname
        const match = Object.entries(APP_CONFIG).find(([, cfg]) =>
          pathname.startsWith(`/${cfg.slug}`)
        )
        if (match) {
          const [, cfg] = match
          if (!pathname.includes('/login')) {
            window.location.href = `${cfg.loginPath}?reason=session_expired`
          }
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
export { api }
