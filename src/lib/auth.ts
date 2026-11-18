import api, { ensureCsrfCookie } from "./api";
import type { AppContext, MeResponse } from "@/types/auth";
import { APP_CONFIG } from "@/types/auth";
import { debugLog } from "@/lib/debug";
import { usePatriarcaSelectionStore } from "@/store/patriarcaSelectionStore";

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
  PUB_INSTITUCIONAL: "/accounts/login/",
};

function clearSessionSelection(appContext: AppContext) {
  if (appContext === "CARGA_ORG_LOT") {
    usePatriarcaSelectionStore.getState().clear();
  }
}

/**
 * Lista aplicações públicas — não requer autenticação.
 * Usada na tela de login para popular o seletor de aplicação.
 * Endpoint: GET /accounts/auth/aplicacoes/
 */

export async function getAplicacoesPublicas(): Promise<AplicacaoPublica[]> {
  const { data } = await api.get("/accounts/auth/aplicacoes/", {
    gppAuthMode: "public",
  });
  debugLog("auth", "getAplicacoesPublicas", data);
  return data;
}

export async function login(
  identifier: string,
  password: string,
  app_context: AppContext,
): Promise<void> {
  clearSessionSelection(app_context);
  debugLog("auth", "login iniciado", { app_context });

  const url = loginRoutes[app_context];

  if (!url) {
    throw new Error(`App context não suportado: ${app_context}`);
  }

  await ensureCsrfCookie();
  await api.post(
    url,
    { identifier: identifier.trim(), password, app_context },
    { gppAuthMode: "public" },
  );

  debugLog("auth", "login concluído");
}

/**
 * Faz logout apenas da aplicação especificada.
 * NÃO encerra sessões de outras apps.
 *
 * @param appContext - Contexto da app que está fazendo logout
 * @returns Promise<void>
 */
export async function logoutApp(appContext: AppContext): Promise<void> {
  const { slug, logoutSlug } = APP_CONFIG[appContext];
  try {
    await api.post(`/accounts/logout/${logoutSlug ?? slug}/`);
  } finally {
    clearSessionSelection(appContext);
  }
}

export async function switchApp(app_context: AppContext): Promise<void> {
  clearSessionSelection(app_context);
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
