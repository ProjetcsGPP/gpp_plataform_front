// src/app/portal/login/page.tsx
import { LoginPage } from '@/components/auth/LoginPage'
import type { LoginTheme } from '@/components/auth/LoginPage'

const portalTheme: LoginTheme = {
  primaryColor:      '#00244a',
  primaryHoverColor: '#003a70',
  appName:           'Dashboard de Ações PNGI',
  subtitle:          'SEGER — Governo do Espírito Santo',
  logoSymbol:        'move_down',
  logoIsMaterialIcon: true,
  defaultAppContext:  'ACOES_PNGI',
  redirectMap: {
    ACOES_PNGI:   '/acoes-pngi/dashboard',
  }
}

export default function PortalLoginPage() {
  return <LoginPage theme={portalTheme} />
}
