// src/app/portal/login/page.tsx
import { LoginPage } from '@/components/auth/LoginPage'
import type { LoginTheme } from '@/components/auth/LoginPage'

const portalTheme: LoginTheme = {
  primaryColor:      '#00244a',
  primaryHoverColor: '#003a70',
  appName:           'SEGER — Governo do Espírito Santo',
  subtitle:          'Orquestrador de Aplicaçãoes',
  logoSymbol:        'view_apps',
  logoIsMaterialIcon: false,
  defaultAppContext:  'PORTAL',
  redirectMap: {
    PORTAL:       '/portal/dashboard',
    ACOES_PNGI:   '/acoes-pngi/dashboard',
    CARGA_ORG_LOT: '/carga-org-lot/dashboard',
  }
}

export default function PortalLoginPage() {
  return <LoginPage theme={portalTheme} />
}
