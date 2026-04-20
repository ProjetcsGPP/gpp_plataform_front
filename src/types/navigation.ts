// src/types/navigation.ts
import type { AppContext } from "@/types/auth";

/** Estrutura de um item de menu conforme definido nos JSONs de public/nav/ */
export interface NavItemDefinition {
  id: string;
  label: string;
  icon: string;
  /** Opcional: grupos de expansão pura não têm rota própria (P6c) */
  href?: string;
  order: number;
  /** Se presente, o backend deve incluir esta chave em `granted` para o item ser habilitado */
  permissionKey?: string;
  /**
   * true  -> item aparece desabilitado (cinza + tooltip) quando sem permissão
   * false -> item é completamente oculto quando sem permissão (padrão)
   */
  visibleWhenDenied?: boolean;
  children?: NavItemDefinition[];
}

/** Formato do JSON em public/nav/{APP}.json */
export interface NavManifestFile {
  items: NavItemDefinition[];
}

/** Item já resolvido após cruzar com permissões do backend */
export interface ResolvedNavItem extends Omit<NavItemDefinition, "children"> {
  enabled: boolean;
  visible: boolean;
  children?: ResolvedNavItem[];
}

/** Resposta do endpoint GET /api/accounts/me/permissions/ — formato legado */
export interface PermissionsResponse {
  role: string;
  granted: string[];
}

/** Slice de permissões por app — formato novo */
export interface AppPermissionsEntry {
  codigo: AppContext;
  role: string | null;
  permissions: string[];
}

/** Resposta multi-app (quando backend retorna apps[]) */
export interface PermissionsResponseMultiApp {
  apps: AppPermissionsEntry[];
}

/** Union para aceitar ambos os formatos */
export type AnyPermissionsResponse =
  | PermissionsResponse
  | PermissionsResponseMultiApp;

/** Type guard — verifica se a resposta é multi-app */
export function isMultiAppResponse(
  r: AnyPermissionsResponse,
): r is PermissionsResponseMultiApp {
  return "apps" in r && Array.isArray((r as PermissionsResponseMultiApp).apps);
}

export interface NavItemDefinition {
  id: string;
  label: string;
  icon: string;
  app: AppContext;
  href?: string;
  order: number;
  permissionKey?: string;
  visibleWhenDenied?: boolean;
  children?: NavItemDefinition[];
}

export interface ResolvedNavItem extends Omit<NavItemDefinition, "children"> {
  enabled: boolean;
  visible: boolean;
  children?: ResolvedNavItem[];
}
