// src/app/carga-org-lot/login/page.tsx
import { LoginPage } from '@/components/auth/LoginPage'
import type { LoginTheme } from '@/components/auth/LoginPage'

const carga_org_lotTheme: LoginTheme = {
  primaryColor:      '#00244a',
  primaryHoverColor: '#003a70',
  appName:           'Carga de Organograma e Lotações',
  subtitle:          'SEGER — Governo do Espírito Santo',
  logoSymbol:        'flowchart',
  logoIsMaterialIcon: false,
  logoProdestSymbol: 'pro-society',
  logoIsProdestIcon: true,
  defaultAppContext:  'CARGA_ORG_LOT',
  redirectMap: {
    CARGA_ORG_LOT: '/carga-org-lot/dashboard',
  }
}

interface CargaOrgLotLoginPageProps {
  searchParams: Promise<{ reason?: string; redirect?: string }>
}

export default async function CargaOrgLotLoginPage({ searchParams }: CargaOrgLotLoginPageProps) {
  const params = await searchParams
  const sessionExpired = params.reason === 'session_expired'

  return (
    <LoginPage
      theme={carga_org_lotTheme}
      sessionExpiredMessage={
        sessionExpired ? 'Sua sessão expirou. Faça login novamente.' : undefined
      }
    />
  )
}
