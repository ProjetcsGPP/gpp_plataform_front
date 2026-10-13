// src/types/navigation.ts
import type { AppContext } from "@/types/auth";

/** Estrutura de um item de menu conforme definido nos JSONs de public/nav/ */
export interface NavItemDefinition {
  id: string;
  /** Chave funcional estável, compartilhada com Menu.codigo no backend. */
  codigo?: string;
  label: string;
  icon: string;
  app: AppContext;
  href?: string;
  order: number;
  permissionKey?: string;
  visibleWhenDenied?: boolean;
  /** Só fica disponível quando o endpoint de menus o entrega por capability. */
  capabilityControlled?: boolean;
  children?: NavItemDefinition[];
}

/** Capability funcional distribuída às roles do usuário na aplicação atual. */
export interface Capability {
  id: number;
  codigo: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  aplicacao_id: number;
  aplicacao_codigo: AppContext;
}

/** Item hierárquico retornado por GET /api/accounts/menus/. */
export interface Menu {
  id: number;
  codigo: string;
  nome: string;
  descricao: string;
  rota: string | null;
  icone: string;
  ordem: number;
  ativo: boolean;
  aplicacao_codigo: AppContext;
  parent: number | null;
  capability: Capability | string | number | null;
  children: Menu[];
}

/** Resposta de navegação já limitada ao app_context da sessão. */
export interface NavigationMenusResponse {
  app_context: AppContext;
  items: Menu[];
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
