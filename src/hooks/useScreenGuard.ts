// src/hooks/useScreenGuard.ts
// Guard de nível de tela: retorna se o usuário pode acessar uma tela
// com base em uma ou mais permissões.
//
// Uso:
//   const { allowed, isLoading } = useScreenGuard(PERMISSIONS.USER_VIEW)
//   const { allowed } = useScreenGuard(
//     [PERMISSIONS.USER_VIEW, PERMISSIONS.USER_CHANGE], 'any'
//   )
//
// Regra: exibir loading enquanto isLoading=true,
//        redirecionar ou mostrar acesso negado quando allowed=false.
"use client";

import { usePermissions } from "@/hooks/usePermissions";
import type { PermissionKey } from "@/lib/permissions";

type MatchMode = "all" | "any";

/**
 * Verifica se o usuário tem acesso a uma tela com base em permissões.
 *
 * @param permissions - Permissão única ou lista de permissões a verificar
 * @param mode        - 'all' exige todas; 'any' basta uma (padrão: 'all')
 */
export function useScreenGuard(
  permissions: PermissionKey | PermissionKey[],
  mode: MatchMode = "all",
): { allowed: boolean; isLoading: boolean; isHydrated: boolean } {
  const { can, hasAny, hasAll, isLoading, isHydrated } = usePermissions();

  const keys = Array.isArray(permissions) ? permissions : [permissions];

  const allowed = isHydrated
    ? mode === "all"
      ? keys.length === 1
        ? can(keys[0])
        : hasAll(keys)
      : hasAny(keys)
    : false;

  return { allowed, isLoading, isHydrated };
}
