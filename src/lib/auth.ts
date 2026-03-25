import api from "./api";

export type AppContext = "PORTAL" | "ACOES_PNGI" | "CARGA_ORG_LOT";

export interface Aplicacao {
  codigointerno: string;
  nomeaplicacao: string;
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
  user_roles: UserRole[];
}

export async function getAplicacoesPublicas(): Promise<Aplicacao[]> {
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
  await api.post("/accounts/login/", { username, password, app_context });
}

export async function logout(): Promise<void> {
  try {
    await api.post("/accounts/logout/");
  } catch {
    // sessão já inválida — segue para redirect normalmente
  }
}

export async function switchApp(app_context: AppContext): Promise<void> {
  await api.post("/accounts/switch-app/", { app_context });
}

export async function getMe(): Promise<MeResponse> {
  const { data } = await api.get("/accounts/me/");
  return data;
}

export async function getAplicacoes(): Promise<Aplicacao[]> {
  const { data } = await api.get("/accounts/aplicacoes/");
  return data;
}
