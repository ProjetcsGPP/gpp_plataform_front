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
 * - Faz GET /api/accounts/me/ usando SWR (cache automático, revalidação em foco)
 * - Hidrata a authStore com os dados recebidos
 * - Limpa a store em caso de erro (401 = sessão inválida)
 * - Cache de 5 minutos (dedupingInterval)
 *
 * @returns { me, isLoading, isError }
 */
export function useMe() {
  const setUser = useAuthStore((s) => s.setUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setLoading = useAuthStore((s) => s.setLoading);

  const { data, error, isLoading } = useSWR<MeResponse>(
    "/accounts/me/",
    fetchMe,
    {
      dedupingInterval: 5 * 60 * 1000, // 5 minutos
      revalidateOnFocus: false, // não revalidar ao trocar de aba
      shouldRetryOnError: false, // não tentar novamente em 401
      onSuccess(data) {
        setUser(data, data.app_context);
      },
      onError() {
        clearAuth();
      },
    },
  );

  // Sincroniza isLoading
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  // Hidrata store com dados do fetch ou do cache (cobre remontagem do layout)
  useEffect(() => {
    if (data && !isLoading) {
      setUser(data, data.app_context);
    }
  }, [data, isLoading, setUser]);
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
 * - Faz GET /api/accounts/me/permissions/ usando SWR
 * - O backend infere a aplicação a partir do cookie de sessão (app_context)
 * - Não revalida em foco — permissões mudam raramente
 * - Cache de 5 minutos (dedupingInterval)
 *
 * @returns { permissions, isLoading, isError }
 */
export function useMePermissions() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data, error, isLoading } = useSWR<MePermissionsResponse>(
    isAuthenticated ? "/accounts/me/permissions/" : null, // só busca se autenticado
    fetchMePermissions,
    {
      dedupingInterval: 5 * 60 * 1000,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );

  return {
    permissions: data ?? null,
    role: data?.role ?? null,
    granted: data?.granted ?? [],
    isLoading,
    isError: !!error,
  };
}
