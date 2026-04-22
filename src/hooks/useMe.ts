// src/hooks/useMe.ts
"use client";

import useSWR from "swr";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import type { MeResponse } from "@/types/auth";

const fetchMe = (url: string): Promise<MeResponse> =>
  api.get<MeResponse>(url).then((res) => res.data);

/**
 * Hook para buscar e cachear os dados do usuário autenticado.
 *
 * - GET /api/accounts/me/ via SWR
 * - keepPreviousData: true — mantém dados antigos enquanto revalida
 * - revalidateOnReconnect: true — re-hidrata store quando rede volta
 * - shouldRetryOnError: false — interceptor 401 do api.ts trata sessão expirada
 */
export function useMe() {
  const setUser         = useAuthStore((s) => s.setUser);
  const clearAuth       = useAuthStore((s) => s.clearAuth);
  const setLoading      = useAuthStore((s) => s.setLoading);
  const setAuthzVersion = useAuthStore((s) => s.setAuthzVersion);

  const { data, error, isLoading } = useSWR<MeResponse>("/accounts/me/", fetchMe, {
    dedupingInterval:      5 * 60 * 1000,
    revalidateOnFocus:     false,
    revalidateOnReconnect: true,
    shouldRetryOnError:    false,
    keepPreviousData:      true,
    onError() {
      clearAuth();
    },
  });

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  useEffect(() => {
    if (data && !isLoading) {
      // Hidrata authStore com dados do usuário e app_context
      setUser(data, data.app_context ?? undefined);

      // Persiste authz_version quando o backend enviar o campo.
      // Fallback seguro: se não vier, mantém o valor anterior.
      if (typeof data.authz_version === "number") {
        setAuthzVersion(data.authz_version);
      }
    }
  }, [data, isLoading, setUser, setAuthzVersion]);

  return { me: data ?? null, isLoading, isError: !!error };
}

// ─── MePermissions ────────────────────────────────────────────────────────────

export interface MePermissionsResponse {
  role: string;
  granted: string[];
}

const fetchMePermissions = (url: string): Promise<MePermissionsResponse> =>
  api.get<MePermissionsResponse>(url).then((res) => res.data);

/**
 * Hook para buscar as permissões do usuário na aplicação atual.
 *
 * - GET /api/accounts/me/permissions/ via SWR
 * - Só dispara quando isAuthenticated === true
 */
export function useMePermissions() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data, error, isLoading } = useSWR<MePermissionsResponse>(
    isAuthenticated ? "/accounts/me/permissions/" : null,
    fetchMePermissions,
    {
      dedupingInterval:      5 * 60 * 1000,
      revalidateOnFocus:     false,
      revalidateOnReconnect: true,
      shouldRetryOnError:    false,
      keepPreviousData:      true,
    },
  );

  return {
    permissions: data ?? null,
    role:        data?.role    ?? null,
    granted:     data?.granted ?? [],
    isLoading,
    isError: !!error,
  };
}
