// src/hooks/usePermissionsHydrator.ts
// Responsável por buscar as permissões do usuário no backend e hidratar
// a permissionsStore. Deve ser montado uma única vez no layout autenticado.
//
// Substitui useMePermissions (useMe.ts) como ponto de hidratação central.
// O hook useMe.ts fica responsável APENAS pelo /me (perfil + sessão).
'use client'

import { useEffect } from 'react'
import useSWR from 'swr'

import { useAuthStore } from '@/store/authStore'
import { usePermissionsStore } from '@/store/permissionsStore'
import api from '@/lib/api'
import type { PermissionsResponse } from '@/types/navigation'

const fetchPermissions = (url: string): Promise<PermissionsResponse> =>
  api.get<PermissionsResponse>(url).then((res) => res.data)

/**
 * Busca GET /api/accounts/me/permissions/ e hidrata a permissionsStore.
 *
 * - Só executa quando o usuário está autenticado
 * - Cache de 5 minutos (dedupingInterval)
 * - revalidateOnFocus desabilitado — revalidação é feita pelo version polling
 * - Em caso de erro (401/403), limpa as permissões da store
 *
 * @returns { mutate } para forçar revalidação (usado pelo version polling)
 */
export function usePermissionsHydrator() {
  const isAuthenticated   = useAuthStore((s) => s.isAuthenticated)
  const setPermissions    = usePermissionsStore((s) => s.setPermissions)
  const clearPermissions  = usePermissionsStore((s) => s.clearPermissions)
  const setLoading        = usePermissionsStore((s) => s.setLoading)

  const { data, error, isLoading, mutate } = useSWR<PermissionsResponse>(
    isAuthenticated ? '/accounts/me/permissions/' : null,
    fetchPermissions,
    {
      dedupingInterval: 5 * 60 * 1000, // 5 minutos
      revalidateOnFocus: false,          // revalidação via version polling
      shouldRetryOnError: false,         // 401 não deve ser reenviado
      onSuccess(data) {
        setPermissions(data.role, data.granted)
      },
      onError() {
        clearPermissions()
      },
    }
  )

  // Sincroniza isLoading da permissionsStore com o SWR
  useEffect(() => {
    setLoading(isLoading)
  }, [isLoading, setLoading])

  return {
    permissions: data ?? null,
    role: data?.role ?? null,
    granted: data?.granted ?? [],
    isLoading,
    isError: !!error,
    /**
     * Força revalidação imediata das permissões.
     * Chamado pelo useVersionPolling quando authz_version ou user_version muda.
     */
    mutate,
  }
}
