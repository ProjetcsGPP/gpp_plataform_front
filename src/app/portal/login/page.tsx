// src/app/portal/login/page.tsx
import { LoginPage } from '@/components/auth/LoginPage'
import type { LoginTheme } from '@/components/auth/LoginPage'

const portalTheme: LoginTheme = {
  primaryColor:      '#00244a',
  primaryHoverColor: '#003a70',
  appName:           'GPP Plataform 2.0',
  subtitle:          'SEGER — Governo do Espírito Santo',
  logoSymbol:        'account_balance',
  logoIsMaterialIcon: true,
  defaultAppContext:  'PORTAL',
  redirectMap: {
    PORTAL:       '/portal/dashboard',
    ACOES_PNGI:   '/acoes-pngi/dashboard',
    CARGA_ORG_LOT: '/carga-org-lot/dashboard',
  },
}

export default function PortalLoginPage() {
  return <LoginPage theme={portalTheme} />
}
