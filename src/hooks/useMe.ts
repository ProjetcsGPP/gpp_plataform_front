// src/hooks/useMe.ts
'use client'

import useSWR from 'swr'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import type { MeResponse } from '@/types/auth'

/**
 * Fetcher tipado para o SWR — usa a instância Axios configurada do projeto.
 */
const fetchMe = (url: string): Promise<MeResponse> =>
  api.get<MeResponse>(url).then((res) => res.data)

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
  const setUser = useAuthStore((s) => s.setUser)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const setLoading = useAuthStore((s) => s.setLoading)

  const { data, error, isLoading } = useSWR<MeResponse>(
    '/accounts/me/',
    fetchMe,
    {
      dedupingInterval: 5 * 60 * 1000, // 5 minutos
      revalidateOnFocus: false,          // não revalidar ao trocar de aba
      shouldRetryOnError: false,         // não tentar novamente em 401
      onSuccess(data) {
        setUser(data, data.app_context)
      },
      onError() {
        clearAuth()
      },
    }
  )

  // Sincroniza isLoading da store com o estado do SWR
  useEffect(() => {
    setLoading(isLoading)
  }, [isLoading, setLoading])

  return {
    me: data ?? null,
    isLoading,
    isError: !!error,
  }
}
