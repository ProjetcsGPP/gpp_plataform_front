// src/components/auth/LoginPage.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { login } from "@/lib/auth";
import { resolvePostLoginRedirect } from "@/lib/authRedirect";
import { Loader2, LogIn } from "lucide-react";
import Image from "next/image";
import { debugError, debugLog } from "@/lib/debug";
import type { AppContext } from "@/types/auth";

// ─── Contrato do tema ───────────────────────────────────────────────
export interface LoginTheme {
  /** Texto exibido como nome da aplicação */
  appName: string;
  /** Subtítulo abaixo do nome */
  subtitle: string;
  /** Símbolo ou texto a exibir dentro do ícone (1–2 chars ou material-symbol) */
  logoSymbol: string;
  /** Usa Material Symbol no logo? Se false, trata logoSymbol como texto */
  logoIsMaterialIcon?: boolean;
  /** Símbolo ou texto a exibir dentro do ícone Prodest */
  logoProdestSymbol: string;
  /** Usa Material Symbol no logo? Se false, trata logoSymbol como texto */
  logoIsProdestIcon?: boolean;
  /** Rodapé */
  footerText?: string;
  /** Contexto padrão pré-selecionado no select */
  defaultAppContext: AppContext;
  /** Rota de redirect após login bem-sucedido para cada contexto */
  redirectMap?: Record<string, string>;
}

interface LoginPageProps {
  theme: LoginTheme;
  sessionExpiredMessage?: string;
  redirectTo?: string;
}

const GENERIC_CREDENTIAL_ERROR =
  "Não foi possível entrar com as credenciais informadas.";

export function LoginPage({
  theme,
  sessionExpiredMessage,
  redirectTo,
}: LoginPageProps) {
  // Não usa useRouter — navegação pós-login é hard navigation (window.location.href)
  // para garantir que o cookie gpp_session_{APP} seja persistido pelo browser
  // antes do AppThemeProvider montar e disparar GET /accounts/me/
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const appContext = theme.defaultAppContext;
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const size = 52;

  let logoElement;
  if (theme.logoIsMaterialIcon) {
    logoElement = (
      <div
        className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-app-primary text-app-primary-text shadow-md"
      >
        <span
          className="material-symbols-outlined leading-none"
          style={{
            fontSize: `${size}px`,
            fontVariationSettings: `'FILL' 1, 'wght' 400, 'opsz' ${size}`,
          }}
        >
          {theme.logoSymbol}
        </span>
      </div>
    );
  } else if (theme.logoIsProdestIcon) {
    logoElement = (
      <div
        className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-app-primary text-app-primary-text shadow-md"
      >
        <i
          className={theme.logoProdestSymbol}
          style={{ fontSize: `${size}px` }}
        />
      </div>
    );
  } else {
    logoElement = (
      <Image
        src="/Logo_GOVES.png"
        alt="Governo do Estado do Espírito Santo"
        width={200}
        height={200}
        className="mx-auto mb-3 w-32 h-auto"
        priority
        loading="eager"
      />
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setLoading(true);

    debugLog("login-page", "submit iniciado", { appContext });

    try {
      await login(
        identifier,
        password,
        appContext as "PORTAL" | "ACOES_PNGI" | "CARGA_ORG_LOT",
      );

      const redirectMap = theme.redirectMap ?? {};
      const fallback = redirectMap[appContext] ?? "/portal/dashboard";
      const destination = resolvePostLoginRedirect(
        redirectTo,
        appContext,
        fallback,
      );

      debugLog("login-page", "login concluído", {
        appContext,
        destination,
      });

      debugLog("login-page", "iniciando navegação completa");

      window.location.href = destination;
    } catch (err: unknown) {
      const error = err as {
        response?: {
          status?: number;
          data?: {
            detail?: string;
            code?: string;
          };
        };
      };

      const status = error.response?.status;
      const code = error.response?.data?.code;

      debugError("login-page", "login falhou", {
        status,
        code,
      });

      if (status === 400 || status === 401 || status === 403) {
        setError(GENERIC_CREDENTIAL_ERROR);
      } else if (status === 429) {
        setError("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
      } else if (status && status >= 500) {
        setError("Serviço de autenticação indisponível. Tente novamente mais tarde.");
      } else {
        setError("Não foi possível conectar ao serviço de autenticação.");
      }

      setLoading(false);
    }
  }

  return (
    <div
      data-app={theme.defaultAppContext}
      className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-app-gradient p-4"
    >
      <div className="w-full max-w-md space-y-6">
        {/* Logo + Nome */}
        <div className="text-center">
          {logoElement}
          <h1 className="text-2xl font-bold text-app-primary">{theme.appName}</h1>
          <p className="text-sm text-on-surface-variant">{theme.subtitle}</p>
        </div>

        {/* Card de formulário */}
        <Card className="rounded-2xl border-app-accent/20 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg text-app-primary">
              Acesso ao Sistema
            </CardTitle>
            <CardDescription>
              Informe suas credenciais para fazer login
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="identifier">Usuário ou E-mail</Label>
                <Input
                  id="identifier"
                  name="identifier"
                  type="text"
                  placeholder="usuário ou e-mail"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  required
                  autoFocus
                  className="focus-visible:border-app-primary focus-visible:ring-app-primary/30"
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
                  autoComplete="current-password"
                  required
                  className="focus-visible:border-app-primary focus-visible:ring-app-primary/30"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-app-primary text-app-primary-text transition-colors hover:bg-app-primary-hover focus-visible:ring-app-primary/30"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" /> Entrar
                  </>
                )}
              </Button>

              {sessionExpiredMessage && !error && (
                <div
                  role="status"
                  className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
                >
                  {sessionExpiredMessage}
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600"
                >
                  {error}
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Rodapé */}
        <p className="text-center text-xs text-on-surface-variant">
          {theme.footerText ??
            `GPP Plataform 2.0 © ${new Date().getFullYear()} SEGER/ES`}
        </p>
      </div>
    </div>
  );
}
