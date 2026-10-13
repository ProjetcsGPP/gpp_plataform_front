// src/components/common/__tests__/LoadingGuard.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'

let authLoading  = false
let permsLoading = false

vi.mock('@/store/authStore', () => ({
  useAuthStore: (sel: (s: { isLoading: boolean }) => unknown) =>
    sel({ isLoading: authLoading }),
}))

vi.mock('@/store/permissionsStore', () => ({
  usePermissionsStore: (sel: (s: { isLoading: boolean }) => unknown) =>
    sel({ isLoading: permsLoading }),
}))

describe('LoadingGuard', () => {
  beforeEach(() => {
    authLoading  = false
    permsLoading = false
  })

  it('renderiza spinner quando authStore.isLoading === true', async () => {
    authLoading = true
    const { LoadingGuard } = await import('@/components/common/LoadingGuard')

    render(<LoadingGuard><p>conteúdo</p></LoadingGuard>)

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('conteúdo')).not.toBeInTheDocument()
  })

  it('renderiza spinner quando permissionsStore.isLoading === true', async () => {
    permsLoading = true
    const { LoadingGuard } = await import('@/components/common/LoadingGuard')

    render(<LoadingGuard><p>conteúdo</p></LoadingGuard>)

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('conteúdo')).not.toBeInTheDocument()
  })

  it('renderiza children quando ambas as stores têm isLoading === false', async () => {
    const { LoadingGuard } = await import('@/components/common/LoadingGuard')

    render(<LoadingGuard><p>conteúdo visível</p></LoadingGuard>)

    expect(screen.getByText('conteúdo visível')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
