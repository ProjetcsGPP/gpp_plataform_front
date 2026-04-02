// src/proxy.ts
// Next.js 16+ usa "proxy" como convencão no lugar de "middleware".
import { NextRequest, NextResponse } from 'next/server'

/**
 * Mapeamento de prefixo de rota para o cookie de sessão correspondente.
 * Nomes exatos conforme definidos pelo backend Django.
 */
const ROUTE_COOKIE_MAP: Record<string, string> = {
  '/portal':        'gpp_session_PORTAL',
  '/acoes-pngi':    'gpp_session_ACOES_PNGI',
  '/carga-org-lot': 'gpp_session_CARGA_ORG_LOT',
}

/**
 * Mapeamento de prefixo de rota para a página de login correspondente.
 */
const ROUTE_LOGIN_MAP: Record<string, string> = {
  '/portal':        '/portal/login',
  '/acoes-pngi':    '/acoes-pngi/login',
  '/carga-org-lot': '/carga-org-lot/login',
}

/**
 * Rotas que NÃO devem ser protegidas (públicas).
 * O proxy passa por elas sem verificar cookie.
 */
function isPublicRoute(pathname: string): boolean {
  const publicSuffixes = ['/login', '/api/', '/_next/', '/favicon', '/static']
  return publicSuffixes.some((suffix) => pathname.includes(suffix))
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Não processar rotas públicas
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Encontrar qual app corresponde a esta rota
  const appPrefix = Object.keys(ROUTE_COOKIE_MAP).find((prefix) =>
    pathname.startsWith(prefix)
  )

  // Rota não mapeada — deixar passar
  if (!appPrefix) {
    return NextResponse.next()
  }

  const cookieName = ROUTE_COOKIE_MAP[appPrefix]
  const loginPath  = ROUTE_LOGIN_MAP[appPrefix]
  const sessionCookie = request.cookies.get(cookieName)

  // Cookie ausente → redirecionar para login da app com motivo
  if (!sessionCookie?.value) {
    const loginUrl = new URL(loginPath, request.url)
    loginUrl.searchParams.set('reason', 'session_expired')
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  /**
   * Aplicar proxy apenas nas rotas de dashboard das apps.
   * Excluir explicitamente: API routes, arquivos estáticos, _next.
   */
  matcher: [
    '/portal/dashboard/:path*',
    '/acoes-pngi/dashboard/:path*',
    '/carga-org-lot/dashboard/:path*',
  ],
}
