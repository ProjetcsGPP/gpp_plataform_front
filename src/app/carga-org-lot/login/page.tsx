// src/app/portal/login/page.tsx
import { LoginPage } from '@/components/auth/LoginPage'
import type { LoginTheme } from '@/components/auth/LoginPage'

const portalTheme: LoginTheme = {
  primaryColor:      '#00244a',
  primaryHoverColor: '#003a70',
  appName:           'Carga de Organograma e Lotações',
  subtitle:          'SEGER — Governo do Espírito Santo',
  logoSymbol:        'view_apps',
  logoIsMaterialIcon: true,
  defaultAppContext:  'CARGA_ORG_LOT',
  redirectMap: {
    CARGA_ORG_LOT: '/carga-org-lot/dashboard',
  }
}

export default function PortalLoginPage() {
  return <LoginPage theme={portalTheme} />
}
