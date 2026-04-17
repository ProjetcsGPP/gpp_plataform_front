// src/hooks/__tests__/useVersionPolling.test.ts
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockBumpManifestVersion = vi.fn()
let mockIsAuthenticated = true

vi.mock('@/store/authStore', () => ({
  useAuthStore: (sel: (s: { isAuthenticated: boolean }) => unknown) =>
    sel({ isAuthenticated: mockIsAuthenticated }),
}))

vi.mock('@/store/navigationStore', () => ({
  useNavigationStore: (sel: (s: { bumpManifestVersion: () => void }) => unknown) =>
    sel({ bumpManifestVersion: mockBumpManifestVersion }),
}))

const mockGlobalMutate = vi.fn()
vi.mock('swr', async (importOriginal) => {
  const actual = await importOriginal<typeof import('swr')>()
  return { ...actual, mutate: mockGlobalMutate }
})

const mockApiGet = vi.fn()
vi.mock('@/lib/api', () => ({
  default: { get: (...args: unknown[]) => mockApiGet(...args) },
}))

describe('useVersionPolling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    mockIsAuthenticated = true
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('chama globalMutate com /accounts/me/permissions/ quando authz_version muda', async () => {
    mockApiGet
      .mockResolvedValueOnce({ data: { authz_version: 1, user_version: 1 } })
      .mockResolvedValueOnce({ data: { authz_version: 2, user_version: 1 } })

    const { useVersionPolling } = await import('@/hooks/useVersionPolling')
    renderHook(() => useVersionPolling())

    await act(async () => { await vi.advanceTimersByTimeAsync(15_000) })
    await act(async () => { await vi.advanceTimersByTimeAsync(15_000) })

    expect(mockGlobalMutate).toHaveBeenCalledWith('/accounts/me/permissions/')
  })

  it('chama bumpManifestVersion quando user_version muda', async () => {
    mockApiGet
      .mockResolvedValueOnce({ data: { authz_version: 5, user_version: 10 } })
      .mockResolvedValueOnce({ data: { authz_version: 5, user_version: 11 } })

    const { useVersionPolling } = await import('@/hooks/useVersionPolling')
    renderHook(() => useVersionPolling())

    await act(async () => { await vi.advanceTimersByTimeAsync(15_000) })
    await act(async () => { await vi.advanceTimersByTimeAsync(15_000) })

    expect(mockBumpManifestVersion).toHaveBeenCalled()
  })

  it('não revalida quando as versões não mudam', async () => {
    mockApiGet
      .mockResolvedValueOnce({ data: { authz_version: 3, user_version: 3 } })
      .mockResolvedValueOnce({ data: { authz_version: 3, user_version: 3 } })

    const { useVersionPolling } = await import('@/hooks/useVersionPolling')
    renderHook(() => useVersionPolling())

    await act(async () => { await vi.advanceTimersByTimeAsync(15_000) })
    await act(async () => { await vi.advanceTimersByTimeAsync(15_000) })

    expect(mockGlobalMutate).not.toHaveBeenCalled()
    expect(mockBumpManifestVersion).not.toHaveBeenCalled()
  })

  it('não executa quando isAuthenticated === false', async () => {
    mockIsAuthenticated = false

    const { useVersionPolling } = await import('@/hooks/useVersionPolling')
    renderHook(() => useVersionPolling())

    await act(async () => { await vi.advanceTimersByTimeAsync(15_000) })

    expect(mockApiGet).not.toHaveBeenCalled()
  })
})
