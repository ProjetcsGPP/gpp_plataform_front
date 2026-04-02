// src/app/acoes-pngi/login/page.tsx
import { LoginPage } from '@/components/auth/LoginPage'
import type { LoginTheme } from '@/components/auth/LoginPage'

const acoes_pngiTheme: LoginTheme = {
  primaryColor:      '#00244a',
  primaryHoverColor: '#003a70',
  appName:           'Dashboard de Ações PNGI',
  subtitle:          'SEGER — Governo do Espírito Santo',
  logoSymbol:        'move_down',
  logoIsMaterialIcon: false,
  logoProdestSymbol: 'pro-stats-bars2',
  logoIsProdestIcon: true,
  defaultAppContext:  'ACOES_PNGI',
  redirectMap: {
    ACOES_PNGI: '/acoes-pngi/dashboard',
  }
}

interface AcoesPngiLoginPageProps {
  searchParams: Promise<{ reason?: string; redirect?: string }>
}

export default async function AcoesPngiLoginPage({ searchParams }: AcoesPngiLoginPageProps) {
  const params = await searchParams
  const sessionExpired = params.reason === 'session_expired'

  return (
    <LoginPage
      theme={acoes_pngiTheme}
      sessionExpiredMessage={
        sessionExpired ? 'Sua sessão expirou. Faça login novamente.' : undefined
      }
    />
  )
}
