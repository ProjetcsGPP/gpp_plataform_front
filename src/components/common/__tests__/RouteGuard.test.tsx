// src/components/common/__tests__/RouteGuard.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'

const mockRouterReplace = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockRouterReplace }),
}))

interface GuardState { allowed: boolean; isLoading: boolean; isHydrated: boolean }
let guardState: GuardState = { allowed: true, isLoading: false, isHydrated: true }

vi.mock('@/hooks/useScreenGuard', () => ({
  useScreenGuard: () => guardState,
}))

describe('RouteGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    guardState = { allowed: true, isLoading: false, isHydrated: true }
  })

  it('não redireciona enquanto isHydrated === false (evita flash de redirect)', async () => {
    guardState = { allowed: false, isLoading: false, isHydrated: false }
    const { RouteGuard } = await import('@/components/common/RouteGuard')

    render(
      <RouteGuard permission="view_user">
        <p>protegido</p>
      </RouteGuard>
    )

    expect(mockRouterReplace).not.toHaveBeenCalled()
  })

  it('redireciona para /acesso-negado quando isHydrated === true e allowed === false', async () => {
    guardState = { allowed: false, isLoading: false, isHydrated: true }
    const { RouteGuard } = await import('@/components/common/RouteGuard')

    render(
      <RouteGuard permission="view_user">
        <p>protegido</p>
      </RouteGuard>
    )

    await vi.waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/acesso-negado')
    })
  })

  it('renderiza children quando isHydrated === true e allowed === true', async () => {
    const { RouteGuard } = await import('@/components/common/RouteGuard')

    render(
      <RouteGuard permission="view_user">
        <p>conteúdo liberado</p>
      </RouteGuard>
    )

    expect(screen.getByText('conteúdo liberado')).toBeInTheDocument()
  })

  it('renderiza loadingFallback enquanto isLoading === true', async () => {
    guardState = { allowed: false, isLoading: true, isHydrated: false }
    const { RouteGuard } = await import('@/components/common/RouteGuard')

    render(
      <RouteGuard
        permission="view_user"
        loadingFallback={<p>carregando...</p>}
      >
        <p>protegido</p>
      </RouteGuard>
    )

    expect(screen.getByText('carregando...')).toBeInTheDocument()
    expect(screen.queryByText('protegido')).not.toBeInTheDocument()
  })
})
