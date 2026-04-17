// src/hooks/__tests__/usePermissionsHydrator.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { SWRConfig } from 'swr'

const mockSetPermissions   = vi.fn()
const mockClearPermissions = vi.fn()
const mockSetLoading       = vi.fn()
let mockIsAuthenticated    = true

vi.mock('@/store/authStore', () => ({
  useAuthStore: (sel: (s: { isAuthenticated: boolean }) => unknown) =>
    sel({ isAuthenticated: mockIsAuthenticated }),
}))

vi.mock('@/store/permissionsStore', () => ({
  usePermissionsStore: (sel: (s: object) => unknown) =>
    sel({
      setPermissions:   mockSetPermissions,
      clearPermissions: mockClearPermissions,
      setLoading:       mockSetLoading,
    }),
}))

const mockApiGet = vi.fn()
vi.mock('@/lib/api', () => ({
  default: { get: (...args: unknown[]) => mockApiGet(...args) },
}))

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(SWRConfig, { value: { provider: () => new Map() } }, children)

describe('usePermissionsHydrator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsAuthenticated = true
  })

  it('hidrata permissionsStore com role e granted[] após resposta bem-sucedida', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: { role: 'PORTAL_ADMIN', granted: ['view_user', 'add_user'] },
    })

    const { usePermissionsHydrator } = await import('@/hooks/usePermissionsHydrator')
    renderHook(() => usePermissionsHydrator(), { wrapper })

    await waitFor(() => {
      expect(mockSetPermissions).toHaveBeenCalledWith(
        'PORTAL_ADMIN',
        ['view_user', 'add_user'],
      )
    })
  })

  it('chama clearPermissions() quando o backend retorna erro', async () => {
    mockApiGet.mockRejectedValueOnce(new Error('401'))

    const { usePermissionsHydrator } = await import('@/hooks/usePermissionsHydrator')
    renderHook(() => usePermissionsHydrator(), { wrapper })

    await waitFor(() => {
      expect(mockClearPermissions).toHaveBeenCalled()
    })
  })

  it('não executa a requisição quando isAuthenticated === false', async () => {
    mockIsAuthenticated = false

    const { usePermissionsHydrator } = await import('@/hooks/usePermissionsHydrator')
    renderHook(() => usePermissionsHydrator(), { wrapper })

    expect(mockApiGet).not.toHaveBeenCalled()
  })

  it('sincroniza isLoading da store com o estado do SWR durante o fetch', async () => {
    let resolvePromise!: (v: unknown) => void
    mockApiGet.mockReturnValueOnce(
      new Promise((res) => { resolvePromise = res }),
    )

    const { usePermissionsHydrator } = await import('@/hooks/usePermissionsHydrator')
    renderHook(() => usePermissionsHydrator(), { wrapper })

    await waitFor(() => {
      expect(mockSetLoading).toHaveBeenCalledWith(true)
    })

    resolvePromise({ data: { role: 'PORTAL_ADMIN', granted: [] } })

    await waitFor(() => {
      expect(mockSetLoading).toHaveBeenCalledWith(false)
    })
  })
})
