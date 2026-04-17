// src/hooks/useMe.ts
"use client";

import useSWR from "swr";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import type { MeResponse } from "@/types/auth";

/**
 * Fetcher tipado para o SWR — usa a instância Axios configurada do projeto.
 */
const fetchMe = (url: string): Promise<MeResponse> =>
  api.get<MeResponse>(url).then((res) => res.data);

/**
 * Hook para buscar e cachear os dados do usuário autenticado.
 *
 * - GET /api/accounts/me/ via SWR
 * - keepPreviousData: true — mantém dados antigos enquanto revalida,
 *   evitando flash de loading/spinner ao navegar ou perder conexão
 * - revalidateOnReconnect: true — re-hidrata a store automaticamente
 *   quando a rede volta após queda de conexão
 * - shouldRetryOnError: false — o interceptor de 401 do api.ts já
 *   trata sessão expirada; retry em loop causaria redirect duplicado
 */
export function useMe() {
  const setUser    = useAuthStore((s) => s.setUser);
  const clearAuth  = useAuthStore((s) => s.clearAuth);
  const setLoading = useAuthStore((s) => s.setLoading);

  const { data, isLoading } = useSWR<MeResponse>("/accounts/me/", fetchMe, {
    dedupingInterval:     5 * 60 * 1000, // 5 min — evita chamadas duplicadas
    revalidateOnFocus:    false,          // foco na aba não revalida
    revalidateOnReconnect: true,          // RECONEXÃO: re-hidrata store quando rede volta
    shouldRetryOnError:   false,          // interceptor do api.ts trata 401
    keepPreviousData:     true,           // mantém dado cacheado durante revalidação
    onError() {
      clearAuth();
    },
  });

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  useEffect(() => {
    if (data && !isLoading) {
      setUser(data);
    }
  }, [data, isLoading, setUser]);

  return { me: data ?? null, isLoading, isError: false };
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
 * - keepPreviousData: true — mesma proteção do useMe
 * - revalidateOnReconnect: true — sincroniza permissões quando rede volta
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
