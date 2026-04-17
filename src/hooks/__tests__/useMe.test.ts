// src/hooks/__tests__/useMe.test.ts
// vi.mock intercepta o modulo inteiro antes do import — unico modo confiavel
// de substituir o default export de api.ts em ESM sem spyOn escapar.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { SWRConfig } from 'swr'
import React from 'react'
import { useAuthStore } from '@/store/authStore'

// Mock declarado antes de qualquer import do modulo alvo
const mockGet = vi.fn()
vi.mock('@/lib/api', () => ({
  default: { get: (...args: unknown[]) => mockGet(...args) },
  api:     { get: (...args: unknown[]) => mockGet(...args) },
}))

// Import apos o mock para garantir que o hook ja usa a versao mockada
const { useMe } = await import('../useMe')

const mockMe = {
  id: 1,
  username: 'carlos.lima',
  name: 'Carlos Lima',
  email: 'carlos@es.gov.br',
  app_context: 'ACOES_PNGI' as const,
  apps: ['ACOES_PNGI' as const],
}

// Cache SWR isolado por teste — evita vazamento entre casos
const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(
    SWRConfig,
    { value: { provider: () => new Map() } },
    children,
  )

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

  it('deve hidratar a store com os dados do usuario apos GET /me bem-sucedido', async () => {
    mockGet.mockResolvedValueOnce({ data: mockMe })

    renderHook(() => useMe(), { wrapper })

    await waitFor(() => {
      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockMe)
      expect(state.appContext).toBe('ACOES_PNGI')
      expect(state.isAuthenticated).toBe(true)
      expect(state.isLoading).toBe(false)
    })
  })

  it('deve chamar clearAuth quando GET /me retorna erro', async () => {
    mockGet.mockRejectedValueOnce(new Error('401'))
    useAuthStore.setState({
      user: mockMe,
      appContext: 'ACOES_PNGI',
      isAuthenticated: true,
      isLoading: false,
    })

    renderHook(() => useMe(), { wrapper })

    await waitFor(() => {
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  it('deve retornar isLoading=false apos a requisicao completar', async () => {
    mockGet.mockResolvedValueOnce({ data: mockMe })

    const { result } = renderHook(() => useMe(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('deve retornar isError=true quando a requisicao falha', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network Error'))

    const { result } = renderHook(() => useMe(), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})
