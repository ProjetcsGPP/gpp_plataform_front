// src/app/portal/login/page.tsx
import { LoginPage } from '@/components/auth/LoginPage'
import type { LoginTheme } from '@/components/auth/LoginPage'

const portalTheme: LoginTheme = {
  primaryColor:      '#00244a',
  primaryHoverColor: '#003a70',
  appName:           'Orquestrador de Aplicações',
  subtitle:          'SEGER — Governo do Espírito Santo',
  logoSymbol:        'view_apps',
  logoIsMaterialIcon: false,
  logoProdestSymbol: 'pro-logo-es',
  logoIsProdestIcon: true,
  defaultAppContext:  'PORTAL',
  redirectMap: {
    PORTAL:       '/portal/dashboard',
  }
}

export default function PortalLoginPage() {
  return <LoginPage theme={portalTheme} />
}
