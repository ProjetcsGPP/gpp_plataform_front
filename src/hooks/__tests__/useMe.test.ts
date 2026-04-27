// src/hooks/__tests__/useMe.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useMe } from '../useMe'
import { useAuthStore } from '@/store/authStore'
import * as apiModule from '@/lib/api'

const mockMe = {
  id: 1,
  username: 'carlos.lima',
  name: 'Carlos Lima',
  email: 'carlos@es.gov.br',
  app_context: 'ACOES_PNGI' as const,
  apps: ['ACOES_PNGI' as const],
}

describe('useMe', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      appContext: null,
      isAuthenticated: false,
      isLoading: true,
    })
    vi.clearAllMocks()
  })

  it('deve hidratar a store com os dados do usuário após GET /me bem-sucedido', async () => {
    vi.spyOn(apiModule.api, 'get').mockResolvedValue({ data: mockMe })

    renderHook(() => useMe())

    await waitFor(() => {
      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockMe)
      expect(state.appContext).toBe('ACOES_PNGI')
      expect(state.isAuthenticated).toBe(true)
      expect(state.isLoading).toBe(false)
    })
  })

  it('deve chamar clearAuth quando GET /me retorna erro', async () => {
    vi.spyOn(apiModule.api, 'get').mockRejectedValue(new Error('401'))
    useAuthStore.setState({
      user: mockMe,
      appContext: 'ACOES_PNGI',
      isAuthenticated: true,
      isLoading: false,
    })

    renderHook(() => useMe())

    await waitFor(() => {
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  it('deve retornar isLoading=false após a requisição completar', async () => {
    vi.spyOn(apiModule.api, 'get').mockResolvedValue({ data: mockMe })

    const { result } = renderHook(() => useMe())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('deve retornar isError=true quando a requisição falha', async () => {
    vi.spyOn(apiModule.api, 'get').mockRejectedValue(new Error('Network Error'))

    const { result } = renderHook(() => useMe())

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})
