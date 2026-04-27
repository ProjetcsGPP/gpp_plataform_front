// src/components/layout/__tests__/TopBar.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TopBar from '../TopBar'
import { useAuthStore } from '@/store/authStore'
import * as authLib from '@/lib/auth'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.spyOn(authLib, 'logoutApp').mockResolvedValue(undefined)

describe('TopBar', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: 1,
        username: 'maria.souza',
        name: 'Maria Souza',
        email: 'maria@es.gov.br',
        app_context: 'PORTAL',
        apps: ['PORTAL'],
      },
      appContext: 'PORTAL',
      isAuthenticated: true,
      isLoading: false,
    })
  })

  it('deve renderizar o título corretamente', () => {
    render(<TopBar title="Portal GPP" titleMinor="SEGER" appContext="PORTAL" />)
    expect(screen.getByText('Portal GPP')).toBeInTheDocument()
    expect(screen.getByText('SEGER')).toBeInTheDocument()
  })

  it('deve chamar logoutApp com o appContext correto ao clicar em sair', async () => {
    render(<TopBar title="Portal GPP" titleMinor="SEGER" appContext="PORTAL" />)
    const logoutBtn = screen.getByRole('button', { name: /sair de portal gpp/i })
    fireEvent.click(logoutBtn)
    await waitFor(() => {
      expect(authLib.logoutApp).toHaveBeenCalledWith('PORTAL')
    })
  })

  it('deve exibir o primeiro nome do usuário autenticado', () => {
    render(<TopBar title="Portal GPP" titleMinor="SEGER" appContext="PORTAL" />)
    expect(screen.getByText('Maria')).toBeInTheDocument()
  })
})
