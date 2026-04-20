// src/hooks/usePermissions.ts
// Hook central de autorização RBAC.
//
// Composição React sobre buildPermissionContext (domain service).
// Único ponto de entrada para verificação de permissões em componentes.
//
// Uso:
//   const { can, hasAny, hasAll, role, isLoading } = usePermissions()
//   can(PERMISSIONS.USER_CHANGE)                          // boolean
//   hasAny([PERMISSIONS.USER_VIEW, PERMISSIONS.USER_ADD]) // boolean
//   hasAll([PERMISSIONS.USER_VIEW, PERMISSIONS.USER_ADD]) // boolean
//
// PROIBIDO: acessar usePermissionsStore diretamente para verificar permissão.
// PROIBIDO: duplicar lógica de has/hasAny/hasAll em componentes.
"use client";

import { useMemo } from "react";
import { usePermissionsStore } from "@/store/permissionsStore";
import { buildPermissionContext } from "@/domain/permissions/permissions.service";

export function usePermissions() {
  const role = usePermissionsStore((s) => s.role);
  const granted = usePermissionsStore((s) => s.granted);
  const isLoading = usePermissionsStore((s) => s.isLoading);
  const isHydrated = usePermissionsStore((s) => s.isHydrated);

  const ctx = useMemo(
    () => buildPermissionContext(role, granted),
    [role, granted],
  );

  return {
    /** Role efetiva do usuário na aplicação atual */
    role,
    /** Lista sanitizada de permissões concedidas */
    granted: ctx.granted,
    isLoading,
    isHydrated,
    /**
     * Verifica se UMA permissão específica está concedida.
     * @example can(PERMISSIONS.USER_CHANGE)
     */
    can: ctx.can,
    /**
     * Verifica se AO MENOS UMA das permissões está concedida.
     * @example hasAny([PERMISSIONS.USER_VIEW, PERMISSIONS.USER_ADD])
     */
    hasAny: ctx.hasAny,
    /**
     * Verifica se TODAS as permissões estão concedidas.
     * @example hasAll([PERMISSIONS.USER_VIEW, PERMISSIONS.USER_ADD])
     */
    hasAll: ctx.hasAll,
  };
}
