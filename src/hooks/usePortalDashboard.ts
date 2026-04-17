// src/hooks/usePortalDashboard.ts
// Hook para o dashboard do portal — usa portal_dashboard_retrieve
// conforme frontend-ai-contract.md:
//   GET /api/portal/dashboard/
//   Retorna { aplicacoes, roles } em uma única chamada
//   Requer sessao_cookie
'use client';

import useSWR from 'swr';
import api from '@/lib/api';

export interface PortalAplicacao {
  idaplicacao: number;
  codigointerno: string;
  nomeaplicacao: string;
  base_url: string;
  isshowinportal: boolean;
}

export interface PortalRole {
  id: number;
  aplicacao_codigo: string;
  role_codigo: string;
  role_nome: string;
}

export interface PortalDashboardResponse {
  aplicacoes: PortalAplicacao[];
  roles: PortalRole[];
}

const fetchPortalDashboard = (url: string): Promise<PortalDashboardResponse> =>
  api.get<PortalDashboardResponse>(url).then((res) => res.data);

/**
 * Busca o dashboard do portal via portal_dashboard_retrieve.
 *
 * Endpoint: GET /api/portal/dashboard/
 * Retorna aplicações visíveis + roles do usuário em uma única chamada,
 * eliminando a race condition entre /me e /accounts/aplicacoes/.
 *
 * Cache de 2 minutos; revalida ao focar a aba.
 */
export function usePortalDashboard() {
  const { data, error, isLoading, mutate } = useSWR<PortalDashboardResponse>(
    '/portal/dashboard/',
    fetchPortalDashboard,
    {
      dedupingInterval: 2 * 60 * 1000,
      refreshInterval: 2 * 60 * 1000,
      revalidateOnFocus: true,
      shouldRetryOnError: false,
    },
  );

  return {
    aplicacoes: data?.aplicacoes ?? [],
    roles: data?.roles ?? [],
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}
