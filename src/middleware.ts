// src/middleware.ts
// Middleware Next.js — executado na edge antes de qualquer layout/page.
//
// Funcionalidades:
//   1. MODO MANUTENCAO: quando NEXT_PUBLIC_PORTAL_MAINTENANCE=true,
//      redireciona todas as rotas /portal/* (exceto /portal/manutencao
//      e /portal/login) para /portal/manutencao.
//
// Como ativar manutencao:
//   No .env.local (desenvolvimento):
//     NEXT_PUBLIC_PORTAL_MAINTENANCE=true
//     NEXT_PUBLIC_MAINTENANCE_RETURN=17/04/2026 as 18h
//     NEXT_PUBLIC_MAINTENANCE_MESSAGE=Atualizacao do banco de dados.
//
//   Em producao: definir a variavel de ambiente no servidor/CI e
//   fazer redeploy (ou usar feature flag via API para hot-reload).

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rotas que NUNCA devem ser interceptadas pelo modo manutencao
const MAINTENANCE_BYPASS = [
  '/portal/manutencao',
  '/portal/login',
  '/_next',
  '/api',
  '/favicon',
  '/nav/',
  '/Logo_',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Modo manutencao do portal ──────────────────────────────────────────────
  const portalMaintenance =
    process.env.NEXT_PUBLIC_PORTAL_MAINTENANCE === 'true'

  if (portalMaintenance && pathname.startsWith('/portal')) {
    const isBypassed = MAINTENANCE_BYPASS.some((bypass) =>
      pathname.startsWith(bypass)
    )
    if (!isBypassed) {
      return NextResponse.redirect(
        new URL('/portal/manutencao', request.url)
      )
    }
  }

  return NextResponse.next()
}

// Aplica o middleware apenas nas rotas do portal
// Exclui arquivos estaticos e rotas de API para nao impactar performance
export const config = {
  matcher: [
    '/portal/:path*',
  ],
}
