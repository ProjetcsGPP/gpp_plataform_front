// src/domain/permissions/permissions.service.ts
// Camada de domínio — TODA a lógica de autorização vive aqui.
// Stores só guardam dados. Hooks compõem React. Services calculam.
//
// Regra de ouro:
//   - NUNCA use strings literais de permissão — use PermissionKey
//   - NUNCA coloque lógica de permissão na store ou em componentes
//   - SEMPRE passe por buildPermissionContext

import { PERMISSIONS, type PermissionKey } from "@/lib/permissions";

// Set de valores válidos para sanitização rápida O(1)
const VALID_PERMISSIONS = new Set<PermissionKey>(Object.values(PERMISSIONS));

export interface PermissionContext {
  /** Role efetiva do usuário na aplicação atual */
  role: string | null;

  /** Lista sanitizada de permissões concedidas (imutável) */
  granted: ReadonlyArray<PermissionKey>;

  /**
   * Verifica se UMA permissão específica está concedida.
   * Alias semântico de `has` — use em guards de UI.
   */
  can: (permission: PermissionKey) => boolean;

  /**
   * Verifica se UMA permissão específica está concedida.
   */
  has: (permission: PermissionKey) => boolean;

  /**
   * Verifica se AO MENOS UMA das permissões está concedida.
   * Equivale ao mode="any" do useScreenGuard.
   */
  hasAny: (permissions: PermissionKey[]) => boolean;

  /**
   * Verifica se TODAS as permissões estão concedidas.
   * Equivale ao mode="all" do useScreenGuard.
   */
  hasAll: (permissions: PermissionKey[]) => boolean;
}

/**
 * Sanitiza o array vindo do backend, descartando tokens inválidos
 * que não existam no registry local (PERMISSIONS).
 *
 * Garante que nenhum valor arbitrário do backend contamina o estado.
 */
function sanitizeGranted(raw: string[]): PermissionKey[] {
  return raw.filter((p): p is PermissionKey =>
    VALID_PERMISSIONS.has(p as PermissionKey),
  );
}

/**
 * Constrói o contexto de autorização a partir dos dados brutos da store.
 *
 * @param role    - Role efetiva do usuário (pode ser null)
 * @param raw     - Lista bruta de permissões vinda do backend
 * @returns       - PermissionContext com métodos de verificação tipados e imutáveis
 *
 * @example
 * const ctx = buildPermissionContext('PORTAL_ADMIN', ['view_user', 'add_user'])
 * ctx.can(PERMISSIONS.USER_VIEW)   // true
 * ctx.hasAny([PERMISSIONS.USER_DELETE, PERMISSIONS.USER_VIEW]) // true
 * ctx.hasAll([PERMISSIONS.USER_VIEW, PERMISSIONS.USER_DELETE]) // false
 */
export function buildPermissionContext(
  role: string | null,
  raw: string[],
): PermissionContext {
  const granted = sanitizeGranted(raw);

  // Estrutura para lookup O(1)
  const grantedSet = new Set<PermissionKey>(granted);

  const has = (permission: PermissionKey): boolean =>
    grantedSet.has(permission);

  const hasAny = (permissions: PermissionKey[]): boolean =>
    permissions.some((p) => grantedSet.has(p));

  const hasAll = (permissions: PermissionKey[]): boolean =>
    permissions.every((p) => grantedSet.has(p));

  // Alias explícito para legibilidade
  const can = has;

  // Imutabilidade do array
  const safeGranted = Object.freeze([...granted]);

  const ctx: PermissionContext = {
    role,
    granted: safeGranted,
    can,
    has,
    hasAny,
    hasAll,
  };

  // Imutabilidade do objeto
  return Object.freeze(ctx);
}
