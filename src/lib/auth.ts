import api from "./api";
import type { AppContext, MeResponse } from "@/types/auth";
import { APP_CONFIG } from "@/types/auth";
import { useAuthStore } from "@/store/authStore";
import { debugLog } from "@/lib/debug";
import { dataTagSymbol } from "@tanstack/react-query";

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
  isshowinportal: boolean;
  isappbloqueada: boolean;
  isappproductionready: boolean;
}

export interface UserRole {
  role_codigo: string;
  role_nome: string;
  aplicacao_codigo: string;
  aplicacao_nome: string;
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
  debugLog("auth", "getAplicacoesPublicas", data);
  return data;
}

// Resolve email → username antes do login
async function resolveUsername(identifier: string): Promise<string> {
  if (!identifier.includes("@")) return identifier; // já é username
  const { data } = await api.post("/accounts/auth/resolve-user/", {
    identifier,
  });

  debugLog("auth", "resolveUsername", data.username);
  return data.username;
}

export async function login(
  identifier: string, // aceita username ou email
  password: string,
  app_context: AppContext,
): Promise<void> {
  debugLog("auth", "login iniciado", {
    identifier,
    app_context,
  });

  const url = loginRoutes[app_context];

  const username = await resolveUsername(identifier);

  if (!url) {
    throw new Error(`App context não suportado: ${app_context}`);
  }

  await api.post(url, {
    username,
    password,
    app_context,
  });

  debugLog("auth", "login concluído");
}

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
  const { slug } = APP_CONFIG[appContext];
  try {
    await api.post(`/accounts/logout/${slug}/`);
  } catch (error) {
    // Silencia erro de rede — o redirect acontece de qualquer forma
    console.warn(
      `[logoutApp] Falha ao chamar endpoint de logout para ${slug}:`,
      error,
    );
  }
}

export async function switchApp(app_context: AppContext): Promise<void> {
  // Pega o usuário logado na store do Zustand para enviar ao backend
  const user = useAuthStore.getState().user;
  const username = user?.username || "";

  // Envia os campos obrigatórios para o serializer do Django não dar 400
  await api.post("/accounts/switch-app/", {
    username: username,
    password: "", // Deixa vazio ou passe uma string padrão se o backend ignorar a validação de senha para sessões ativas
    app_context: app_context,
  });
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
