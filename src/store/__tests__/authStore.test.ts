// src/store/__tests__/authStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../authStore'
import type { MeResponse } from '@/types/auth'

const mockUser: MeResponse = {
  id: 1,
  username: 'joao.silva',
  name: 'João Silva',
  email: 'joao@es.gov.br',
  app_context: 'PORTAL',
  apps: ['PORTAL', 'ACOES_PNGI'],
}

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      appContext: null,
      isAuthenticated: false,
      isLoading: true,
    })
  })

  it('estado inicial deve ter user nulo e isLoading true', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.appContext).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.isLoading).toBe(true)
  })

  it('setUser deve autenticar o usuário corretamente', () => {
    useAuthStore.getState().setUser(mockUser, 'PORTAL')
    const state = useAuthStore.getState()
    expect(state.user).toEqual(mockUser)
    expect(state.appContext).toBe('PORTAL')
    expect(state.isAuthenticated).toBe(true)
    expect(state.isLoading).toBe(false)
  })

  it('clearAuth deve limpar todo o estado', () => {
    useAuthStore.getState().setUser(mockUser, 'PORTAL')
    useAuthStore.getState().clearAuth()
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.appContext).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('setLoading deve atualizar somente isLoading', () => {
    useAuthStore.getState().setUser(mockUser, 'PORTAL')
    useAuthStore.getState().setLoading(true)
    const state = useAuthStore.getState()
    expect(state.isLoading).toBe(true)
    expect(state.user).toEqual(mockUser)
  })
})
