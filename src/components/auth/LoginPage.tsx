// src/components/auth/LoginPage.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { getAplicacoesPublicas, login } from '@/lib/auth'
import type { AplicacaoPublica } from '@/lib/auth'
import { Loader2, LogIn } from 'lucide-react'
import Image from "next/image";


// ─── Contrato do tema ───────────────────────────────────────────────
export interface LoginTheme {
  /** Cor principal (fundo do ícone, botão, foco) — ex: "#00244a" */
  primaryColor: string
  /** Cor do hover do botão — ex: "#003a70" */
  primaryHoverColor: string
  /** Texto exibido como nome da aplicação */
  appName: string
  /** Subtítulo abaixo do nome */
  subtitle: string
  /** Símbolo ou texto a exibir dentro do ícone (1–2 chars ou material-symbol) */
  logoSymbol: string
  /** Usa Material Symbol no logo? Se false, trata logoSymbol como texto */
  logoIsMaterialIcon?: boolean
  /** Rodapé */
  footerText?: string
  /** Contexto padrão pré-selecionado no select */
  defaultAppContext?: string
  /** Rota de redirect após login bem-sucedido para cada contexto */
  redirectMap?: Record<string, string>
}

interface LoginPageProps {
  theme: LoginTheme
}

// ─── Utilitário inline (sem dependência extra) ───────────────────────────
function inlineStyle(color: string) {
  return { backgroundColor: color } as React.CSSProperties
}

// ─── Componente ─────────────────────────────────────────────────────────────────────────
export function LoginPage({ theme }: LoginPageProps) {
  const router = useRouter()
  const [apps, setApps] = useState<AplicacaoPublica[]>([])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [appContext, setAppContext] = useState(theme.defaultAppContext ?? 'PORTAL')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const size = 24;

  useEffect(() => {
    getAplicacoesPublicas()
      .then((data) => setApps(data))
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password, appContext as 'PORTAL' | 'ACOES_PNGI' | 'CARGA_ORG_LOT')

      const redirectMap = theme.redirectMap ?? {}
      const destination = redirectMap[appContext] ?? '/portal/dashboard'
      router.push(destination)
    } catch (err: unknown) {
      const e = err as {
        response?: { status?: number; data?: { detail?: string } }
      }
      const status = e.response?.status
      const detail = e.response?.data?.detail
      if (status === 401) setError('Usuário ou senha incorretos.')
      else if (status === 403) setError(detail ?? 'Sem permissão para esta aplicação.')
      else if (status === 400) setError(detail ?? 'Preencha todos os campos.')
      else setError(detail ?? 'Erro ao realizar login.')
    } finally {
      setLoading(false)
    }
  }

  const focusRingStyle = {
    '--tw-ring-color': theme.primaryColor,
  } as React.CSSProperties

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4">
      {/* min-h desconta a altura do TopBar (64px) para centralizar visualmente */}
      <div className="w-full max-w-md space-y-6">

        {/* Logo + Nome */}
        <div className="text-center">
          {theme.logoIsMaterialIcon ? (
            <div
              className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl shadow-md"
              style={inlineStyle(theme.primaryColor)}
            >
              <span
                className="material-symbols-outlined text-white leading-none"
                style={{
                  fontSize: `${size}px`,
                  fontVariationSettings: `'FILL' 1, 'wght' 400, 'opsz' ${size}`,
                }}
              >
                {theme.logoSymbol}
              </span>
            </div>
          ) : (
            <Image
              src="/Logo_GOVES.png"
              alt="Governo do Estado do Espírito Santo"
              width={200}
              height={200}
              className="mx-auto mb-3 w-32 h-auto"
            />
          )}

          <h1 className="text-2xl font-bold text-slate-800">
            {theme.appName}
          </h1>
          <p className="text-sm text-slate-800">
            {theme.subtitle}
          </p>
        </div>

        {/* Card de formulário */}
        <Card className="shadow-md rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg text-slate-700">Acesso ao Sistema</CardTitle>
            <CardDescription>
              Informe suas credenciais para fazer login
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="username">Usuário ou E-mail</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="usuário ou e-mail"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                  style={focusRingStyle}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={focusRingStyle}
                />
              </div>
              
              <Button
                type="submit"
                disabled={loading}
                className="w-full text-white transition-colors"
                style={{
                  backgroundColor: theme.primaryColor,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = theme.primaryHoverColor)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = theme.primaryColor)
                }
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando...</>
                ) : (
                  <><LogIn className="mr-2 h-4 w-4" /> Entrar</>
                )}
              </Button>

              {error && (
                <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}
                            
            </form>
          </CardContent>
        </Card>

        {/* Rodapé */}
        <p className="text-center text-xs text-slate-800">
          {theme.footerText ?? `GPP Plataform 2.0 © ${new Date().getFullYear()} SEGER/ES`}
        </p>
      </div>
    </div>
  )
}
