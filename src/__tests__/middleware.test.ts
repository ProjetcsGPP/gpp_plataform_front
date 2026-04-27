// src/__tests__/middleware.test.ts
import { describe, it, expect } from 'vitest'
import { proxy } from '../proxy'
import { NextRequest } from 'next/server'

function makeRequest(pathname: string, cookies: Record<string, string> = {}): NextRequest {
  const url = `http://localhost:3000${pathname}`
  const req = new NextRequest(url)
  Object.entries(cookies).forEach(([name, value]) => {
    req.cookies.set(name, value)
  })
  return req
}

describe('proxy — FASE 4', () => {
  // ── PORTAL ────────────────────────────────────────────────────────
  it('deve redirecionar /portal/dashboard sem cookie para /portal/login', () => {
    const req = makeRequest('/portal/dashboard')
    const res = proxy(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/portal/login')
    expect(res.headers.get('location')).toContain('reason=session_expired')
    expect(res.headers.get('location')).toContain('redirect=%2Fportal%2Fdashboard')
  })

  it('deve deixar /portal/dashboard passar com cookie gpp_session_PORTAL presente', () => {
    const req = makeRequest('/portal/dashboard', {
      'gpp_session_PORTAL': 'valid-session-token',
    })
    const res = proxy(req)
    expect(res.status).toBe(200)
  })

  // ── ACOES PNGI ────────────────────────────────────────────────────
  it('deve redirecionar /acoes-pngi/dashboard sem cookie correto', () => {
    // Tem cookie do portal mas NÃO do acoes-pngi — sessões são independentes
    const req = makeRequest('/acoes-pngi/dashboard', {
      'gpp_session_PORTAL': 'valid-session-token',
    })
    const res = proxy(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/acoes-pngi/login')
    expect(res.headers.get('location')).toContain('reason=session_expired')
  })

  it('deve deixar /acoes-pngi/dashboard passar com cookie gpp_session_ACOES_PNGI presente', () => {
    const req = makeRequest('/acoes-pngi/dashboard', {
      'gpp_session_ACOES_PNGI': 'valid-session-token',
    })
    const res = proxy(req)
    expect(res.status).toBe(200)
  })

  // ── CARGA ORG LOT ─────────────────────────────────────────────────
  it('deve redirecionar /carga-org-lot/dashboard sem cookie correto', () => {
    const req = makeRequest('/carga-org-lot/dashboard')
    const res = proxy(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/carga-org-lot/login')
  })

  it('deve deixar /carga-org-lot/dashboard passar com cookie gpp_session_CARGA_ORG_LOT presente', () => {
    const req = makeRequest('/carga-org-lot/dashboard', {
      'gpp_session_CARGA_ORG_LOT': 'valid-session-token',
    })
    const res = proxy(req)
    expect(res.status).toBe(200)
  })

  // ── ROTAS PÚBLICAS ────────────────────────────────────────────────
  it('deve deixar rotas de login passarem sem verificar cookie', () => {
    const req = makeRequest('/portal/login')
    const res = proxy(req)
    expect(res.status).toBe(200)
  })

  it('deve deixar rotas de API passarem sem verificar cookie', () => {
    const req = makeRequest('/api/accounts/me/')
    const res = proxy(req)
    expect(res.status).toBe(200)
  })

  it('deve deixar _next/ passar sem verificar cookie', () => {
    const req = makeRequest('/_next/static/chunks/main.js')
    const res = proxy(req)
    expect(res.status).toBe(200)
  })

  // ── ISOLAMENTO ENTRE APPS ─────────────────────────────────────────
  it('cookie de ACOES_PNGI nao deve proteger rota do PORTAL', () => {
    const req = makeRequest('/portal/dashboard', {
      'gpp_session_ACOES_PNGI': 'valid-session-token',
    })
    const res = proxy(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/portal/login')
  })

  it('cookie de CARGA_ORG_LOT nao deve proteger rota de ACOES_PNGI', () => {
    const req = makeRequest('/acoes-pngi/dashboard', {
      'gpp_session_CARGA_ORG_LOT': 'valid-session-token',
    })
    const res = proxy(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/acoes-pngi/login')
  })
})
