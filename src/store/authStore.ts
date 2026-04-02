// src/store/authStore.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { AppContext, MeResponse } from '@/types/auth'

interface AuthState {
  // ── Estado ────────────────────────────────────────────────
  user: MeResponse | null
  appContext: AppContext | null
  isAuthenticated: boolean
  isLoading: boolean

  // ── Ações ─────────────────────────────────────────────────
  /**
   * Chamado após login bem-sucedido ou após GET /api/accounts/me/ retornar 200.
   */
  setUser: (user: MeResponse, appContext: AppContext) => void

  /**
   * Chamado após logout bem-sucedido. Limpa todo o estado de auth.
   */
  clearAuth: () => void

  /**
   * Controla o estado de carregamento inicial (enquanto /me está sendo chamado).
   */
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      user: null,
      appContext: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user, appContext) =>
        set(
          { user, appContext, isAuthenticated: true, isLoading: false },
          false,
          'auth/setUser'
        ),

      clearAuth: () =>
        set(
          { user: null, appContext: null, isAuthenticated: false, isLoading: false },
          false,
          'auth/clearAuth'
        ),

      setLoading: (isLoading) =>
        set({ isLoading }, false, 'auth/setLoading'),
    }),
    { name: 'gpp-auth-store' }
  )
)
