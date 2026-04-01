// src/types/auth.ts

/**
 * Valores retornados pelo backend no campo app_context.
 * Adicionar novos apps aqui quando criados no backend.
 */
export type AppContext = 'PORTAL' | 'ACOES_PNGI' | 'CARGA_ORG_LOT'

/**
 * Resposta do endpoint GET /api/accounts/me/
 * Expandir conforme backend evoluir.
 */
export interface MeResponse {
  id: number
  username: string
  name: string
  email: string
  app_context: AppContext
  apps: AppContext[]
}

/**
 * Mapeamento de cada app para seu slug de logout e rota de login.
 * Utilizado por logoutApp() e pelo TopBar.
 */
export const APP_CONFIG: Record<AppContext, { slug: string; loginPath: string; label: string }> = {
  PORTAL:        { slug: 'portal',        loginPath: '/portal/login',        label: 'Portal GPP' },
  ACOES_PNGI:    { slug: 'acoes-pngi',    loginPath: '/acoes-pngi/login',    label: 'Ações PNGI' },
  CARGA_ORG_LOT: { slug: 'carga-org-lot', loginPath: '/carga-org-lot/login', label: 'Carga Org/Lot' },
}
