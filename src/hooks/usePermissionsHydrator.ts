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
        // FIX: lê appContext diretamente do store no momento da execução,
        // não do closure React. Isso garante o valor correto mesmo quando
        // /me/permissions/ resolve antes de /me/ (chamadas SWR paralelas).
        const appContext: AppContext | null =
          useAuthStore.getState().appContext;

        if (isMultiAppResponse(data)) {
          // Formato multi-app: itera todos os apps.
          // setPermissionsForApp já baixa isLoading + sobe isHydrated.
          for (const entry of data.apps) {
            setPermissionsForApp(
              entry.codigo,
              entry.role,
              toPermissionKeys(entry.permissions),
            );
          }

          // Fallback para o slice legado: usa appContext do store ou
          // o primeiro app da lista caso appContext ainda seja null.
          const resolvedContext: AppContext | null =
            appContext ??
            (data.apps.length > 0 ? data.apps[0].codigo : null);

          if (resolvedContext) {
            const current = data.apps.find(
              (a) => a.codigo === resolvedContext,
            );
            if (current) {
              setPermissions(
                current.role ?? null,
                toPermissionKeys(current.permissions),
              );
            }
          }
        } else {
          // Formato legado: setPermissions baixa isLoading + sobe isHydrated.
          setPermissions(data.role, toPermissionKeys(data.granted));

          // Popula permissionsByApp para que useNavigation encontre o slice
          // via permissionsByApp[appContext] sem depender do slice legado plano.
          // FIX: usa getState() — valor atual, não o do closure.
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
