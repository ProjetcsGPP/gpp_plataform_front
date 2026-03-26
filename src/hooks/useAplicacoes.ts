'use client';
import useSWR from 'swr';
import { getAplicacoes } from '@/lib/auth';
import type { Aplicacao } from '@/lib/auth';

export function useAplicacoes() {
  const { data: apps, error, isLoading, mutate } = useSWR(
    'aplicacoes',  // cache key único
    getAplicacoes,
    {
      refreshInterval: 120000,  // 2 minutos (não agressivo)
      revalidateOnFocus: true,  // refaz quando volta na aba
      revalidateIfStale: true,  // sempre atualiza se cache "velho"
    }
  );

  return { apps: apps ?? [], error, isLoading, refresh: mutate };
}
