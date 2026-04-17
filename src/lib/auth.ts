import api from "./api";
import type { AppContext } from '@/types/auth'
import { APP_CONFIG } from '@/types/auth'

// Dados mínimos retornados pelo endpoint público (sem autenticação)
export interface AplicacaoPublica {
  codigointerno: string;
  nomeaplicacao: string;
}

// Dados completos retornados pelo endpoint autenticado
export interface Aplicacao {
  idaplicacao: number;
  codigointerno: string;
  nomeaplicacao: string;
  base_url: string;
  isshowinportal: boolean
  isappbloqueada: boolean
  isappproductionready: boolean
}

export interface UserRole {
  role_codigo: string;
  role_nome: string;
  aplicacao_codigo: string;
  aplicacao_nome: string;
}

export interface MeResponse {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_portal_admin: boolean;
  name: string;
  orgao: string;
  roles: UserRole[];
}

const loginRoutes: Record<AppContext, string> = {
  PORTAL: "/accounts/login/",
  ACOES_PNGI: "/accounts/login/",
  CARGA_ORG_LOT: "/accounts/login/",
};

/**
 * Lista aplicações públicas — não requer autenticação.
 * Usada na tela de login para popular o seletor de aplicação.
 * Endpoint: GET /accounts/auth/aplicacoes/
 */
export async function getAplicacoesPublicas(): Promise<AplicacaoPublica[]> {
  const { data } = await api.get("/accounts/auth/aplicacoes/");
  return data;
}

// Resolve email → username antes do login
async function resolveUsername(identifier: string): Promise<string> {
  if (!identifier.includes("@")) return identifier; // já é username
  const { data } = await api.post("/accounts/auth/resolve-user/", { identifier });
  return data.username;
}

export async function login(
  identifier: string,  // aceita username ou email
  password: string,
  app_context: AppContext
): Promise<void> {
  const username = await resolveUsername(identifier);

  const url = loginRoutes[app_context];

  if (!url) {
    throw new Error(`App context não suportado: ${app_context}`);
  }

  await api.post(url, {
    username,
    password,
    app_context,
  });
}

/** @deprecated Use logoutApp(appContext) instead */
export async function logout(): Promise<void> {
  try {
    await api.post("/accounts/logout/");
  } catch {
    // sessão já inválida — segue para redirect normalmente
  }
}

/**
 * Faz logout apenas da aplicação especificada.
 * NÃO encerra sessões de outras apps.
 *
 * @param appContext - Contexto da app que está fazendo logout
 * @returns Promise<void>
 */
export async function logoutApp(appContext: AppContext): Promise<void> {
  const { slug } = APP_CONFIG[appContext]
  try {
    await api.post(`/accounts/logout/${slug}/`)
  } catch (error) {
    // Silencia erro de rede — o redirect acontece de qualquer forma
    console.warn(`[logoutApp] Falha ao chamar endpoint de logout para ${slug}:`, error)
  }
}

export async function switchApp(app_context: AppContext): Promise<void> {
  await api.post("/accounts/switch-app/", { app_context });
}

export async function getMe(): Promise<MeResponse> {
  const { data } = await api.get("/accounts/me/");
  return data;
}

/**
 * Lista aplicações às quais o usuário autenticado tem acesso (filtrado por roles no backend).
 * Requer sessão autenticada.
 * Endpoint: GET /accounts/aplicacoes/
 */
export async function getAplicacoes(): Promise<Aplicacao[]> {
  const { data } = await api.get("/accounts/aplicacoes/");
  return data;
}
