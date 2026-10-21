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
import { debugError, debugLog } from "@/lib/debug";
import { permissionsCacheKey } from "@/lib/authCacheKeys";

const fetchPermissions = (
  [url]: ReturnType<typeof permissionsCacheKey>,
): Promise<AnyPermissionsResponse> => {
  debugLog("permissions", "buscando permissões", { url });

  return api.get<AnyPermissionsResponse>(url).then((res) => {
    debugLog("permissions", "permissões recebidas", {
      status: res.status,
    });

    return res.data;
  });
};

export function usePermissionsHydrator(appContext: AppContext) {
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
    isAuthenticated ? permissionsCacheKey(appContext) : null,
    fetchPermissions,
    {
      dedupingInterval: 5 * 60 * 1000,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      onSuccess(data) {
        debugLog("permissions", "hidratação concluída", {
          appContext,
          multiApp: isMultiAppResponse(data),
        });

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

          const current = data.apps.find((a) => a.codigo === appContext);
          if (current) {
            setPermissions(
              current.role ?? null,
              toPermissionKeys(current.permissions),
            );
          }
        } else {
          // Formato legado: setPermissions baixa isLoading + sobe isHydrated.
          setPermissions(data.role, toPermissionKeys(data.granted));

          // Popula permissionsByApp para que useNavigation encontre o slice
          // via permissionsByApp[appContext] sem depender do slice legado plano.
          setPermissionsForApp(
            appContext,
            data.role,
            toPermissionKeys(data.granted),
          );
        }
      },
      onError(error) {
        debugError("permissions", "erro ao carregar permissões", {
          status: error?.response?.status,
          data: error?.response?.data,
        });
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
