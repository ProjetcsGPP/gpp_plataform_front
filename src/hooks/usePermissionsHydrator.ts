// src/hooks/usePermissionsHydrator.ts
"use client";

import { useEffect } from "react";
import useSWR from "swr";

import { useAuthStore } from "@/store/authStore";
import { usePermissionsStore } from "@/store/permissionsStore";
import api from "@/lib/api";
import type { AnyPermissionsResponse } from "@/types/navigation";
import { isMultiAppResponse } from "@/types/navigation";
import type { AppContext } from "@/types/auth";
import type { PermissionKey } from "@/lib/permissions";

const fetchPermissions = (url: string): Promise<AnyPermissionsResponse> =>
  api.get<AnyPermissionsResponse>(url).then((res) => res.data);

export function usePermissionsHydrator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const appContext = useAuthStore((s) => s.appContext);
  const setPermissions = usePermissionsStore((s) => s.setPermissions);
  const clearPermissions = usePermissionsStore((s) => s.clearPermissions);
  const setLoading = usePermissionsStore((s) => s.setLoading);
  const setPermissionsForApp = usePermissionsStore(
    (s) => s.setPermissionsForApp,
  );

  function toPermissionKeys(raw: string[]): PermissionKey[] {
    return raw as PermissionKey[];
  }

  const { data, error, isLoading, mutate } = useSWR<AnyPermissionsResponse>(
    isAuthenticated ? "/accounts/me/permissions/" : null,
    fetchPermissions,
    {
      dedupingInterval: 5 * 60 * 1000,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      onSuccess(data) {
        if (isMultiAppResponse(data)) {
          // Formato novo: itera todos os apps
          for (const entry of data.apps) {
            setPermissionsForApp(
              entry.codigo,
              entry.role,
              toPermissionKeys(entry.permissions),
            );
          }
          // Compatibilidade legada: preenche role/granted do app atual
          if (appContext) {
            const current = data.apps.find((a) => a.codigo === appContext);
            if (current) {
              setPermissions(
                current.role ?? null,
                toPermissionKeys(current.permissions),
              );
            }
          }
        } else {
          // Formato legado: popula apenas o app atual
          setPermissions(data.role, toPermissionKeys(data.granted));
          if (appContext) {
            setPermissionsForApp(
              appContext,
              data.role,
              toPermissionKeys(data.granted),
            );
          }
        }
      },
      onError() {
        clearPermissions();
      },
    },
  );

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  return {
    permissions: data ?? null,
    isLoading,
    isError: !!error,
    mutate,
  };
}
