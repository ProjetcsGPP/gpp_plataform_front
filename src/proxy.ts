// src/proxy.ts
// Next.js 16+ usa "proxy" como convencao no lugar de "middleware".
import { NextRequest, NextResponse } from 'next/server'

/**
 * Mapeamento de prefixo de rota para o cookie de sessao correspondente.
 * Nomes exatos conforme definidos pelo backend Django.
 */
const ROUTE_COOKIE_MAP: Record<string, string> = {
  '/portal':        'gpp_session_PORTAL',
  '/acoes-pngi':    'gpp_session_ACOES_PNGI',
  '/carga-org-lot': 'gpp_session_CARGA_ORG_LOT',
}

/**
 * Mapeamento de prefixo de rota para a pagina de login correspondente.
 */
const ROUTE_LOGIN_MAP: Record<string, string> = {
  '/portal':        '/portal/login',
  '/acoes-pngi':    '/acoes-pngi/login',
  '/carga-org-lot': '/carga-org-lot/login',
}

/**
 * Rotas que NAO devem ser protegidas pelo guard de cookie nem
 * pelo modo manutencao (publicas / assets).
 */
const PUBLIC_BYPASSES = [
  '/portal/login',
  '/portal/manutencao',
  '/acoes-pngi/login',
  '/carga-org-lot/login',
  '/api/',
  '/_next/',
  '/favicon',
  '/static',
  '/nav/',
  '/Logo_',
]

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_BYPASSES.some((bypass) => pathname.startsWith(bypass) || pathname.includes(bypass))
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas publicas passam direto
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // ── Modo manutencao do portal ────────────────────────────────────────────
  // Ativar: NEXT_PUBLIC_PORTAL_MAINTENANCE=true no .env.local ou no servidor
  // Desativar: remover a variavel ou setar =false e restartar o servidor
  const portalMaintenance = process.env.NEXT_PUBLIC_PORTAL_MAINTENANCE === 'true'
  if (portalMaintenance && pathname.startsWith('/portal')) {
    return NextResponse.redirect(new URL('/portal/manutencao', request.url))
  }

  // ── Guard de cookie de sessao ─────────────────────────────────────────────
  const appPrefix = Object.keys(ROUTE_COOKIE_MAP).find((prefix) =>
    pathname.startsWith(prefix)
  )

  // Rota nao mapeada — deixar passar
  if (!appPrefix) {
    return NextResponse.next()
  }

  const cookieName    = ROUTE_COOKIE_MAP[appPrefix]
  const loginPath     = ROUTE_LOGIN_MAP[appPrefix]
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
   * Matcher expandido para cobrir /portal/* durante modo manutencao.
   * O guard de cookie so atua nas rotas de dashboard (definido pela logica acima).
   * Arquivos estaticos e _next sao excluidos automaticamente pelo Next.js
   * quando o path nao bate com os padroes abaixo.
   */
  matcher: [
    '/portal/:path*',
    '/acoes-pngi/dashboard/:path*',
    '/carga-org-lot/dashboard/:path*',
  ],
}
