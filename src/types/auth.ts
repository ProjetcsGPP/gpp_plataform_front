// src/types/auth.ts

export type AppContext = "PORTAL" | "ACOES_PNGI" | "CARGA_ORG_LOT";

export interface UserRole {
  id: number;
  aplicacao_codigo: AppContext;
  aplicacao_nome: string;
  role_codigo: string;
  role_nome: string;
}

export interface MeResponse {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  name: string;
  is_portal_admin: boolean;
  orgao: string;
  status_usuario_id: number;
  app_context: AppContext;
  apps: AppContext[];
  roles: UserRole[];
  authz_version?: number; // FASE 5 — versão de autorização para polling
}

export const APP_CONFIG: Record<
  AppContext,
  { slug: string; loginPath: string; label: string }
> = {
  PORTAL: { slug: "portal", loginPath: "/portal/login", label: "Portal GPP" },
  ACOES_PNGI: {
    slug: "acoes-pngi",
    loginPath: "/acoes-pngi/login",
    label: "Ações PNGI",
  },
  CARGA_ORG_LOT: {
    slug: "carga-org-lot",
    loginPath: "/carga-org-lot/login",
    label: "Carga Org/Lot",
  },
};
