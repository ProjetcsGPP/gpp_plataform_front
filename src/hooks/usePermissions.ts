// src/hooks/usePermissions.ts
// Hook central de autorização RBAC — consciente de AppContext.
//
// Fluxo:
//   1. Lê appContext do authStore
//   2. Seleciona permissionsByApp[appContext] da permissionsStore
//   3. Passa role+granted para buildPermissionContext (service inalterado)
//
// Fallback seguro: appContext null → role=null, granted=[] → can() = false
"use client";

import { useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import { type PermissionKey } from "@/lib/permissions";
import { usePermissionsStore } from "@/store/permissionsStore";
import { buildPermissionContext } from "@/domain/permissions/permissions.service";

export function usePermissions() {
  const appContext = useAuthStore((s) => s.appContext);
  const permissionsByApp = usePermissionsStore((s) => s.permissionsByApp);
  const isLoading = usePermissionsStore((s) => s.isLoading);
  const isHydrated = usePermissionsStore((s) => s.isHydrated);

  // Seleciona o slice do app ativo — fallback seguro se contexto ausente
  const { role, granted } = useMemo(() => {
    if (!appContext) return { role: null, granted: [] as PermissionKey[] };
    const slice = permissionsByApp[appContext];

    return slice ?? { role: null, granted: [] as PermissionKey[] };
  }, [appContext, permissionsByApp]);

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
    /** Contexto de app ativo */
    appContext,
    can: ctx.can,
    hasAny: ctx.hasAny,
    hasAll: ctx.hasAll,
  };
}
