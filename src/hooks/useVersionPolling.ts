// src/hooks/useVersionPolling.ts
// Polling de versão para detectar mudanças de permissão em tempo real.
//
// Fluxo:
//   GET /api/system/version/ a cada POLLING_INTERVAL ms
//   Se authz_version ou user_version mudou → revalida permissões e navegação
//
// Efeitos suportados:
//   - Usuário perdeu role
//   - Usuário recebeu revoke de permissão
//   - Usuário foi desativado
//   - Mudança em grupo/permissão
//   - Logout forçado pelo admin
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { mutate as globalMutate } from 'swr'

import { useAuthStore } from '@/store/authStore'
import { useNavigationStore } from '@/store/navigationStore'
import api from '@/lib/api'

/** Intervalo de polling em ms (15 segundos) */
const POLLING_INTERVAL = 15_000

interface VersionResponse {
  authz_version: number
  user_version: number
}

/**
 * Hook de polling de versão RBAC.
 *
 * Deve ser montado no layout autenticado, junto com usePermissionsHydrator.
 * Automaticamente pausa quando a aba está em background (visibilitychange).
 *
 * @example
 *   // Em um layout autenticado:
 *   useVersionPolling()
 */
export function useVersionPolling() {
  const isAuthenticated   = useAuthStore((s) => s.isAuthenticated)
  const bumpManifestVersion = useNavigationStore((s) => s.bumpManifestVersion)

  // Referências mutáveis para evitar re-renders desnecessários
  const lastAuthzVersion = useRef<number | null>(null)
  const lastUserVersion  = useRef<number | null>(null)
  const timerRef         = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isActiveRef      = useRef(true)

  const checkVersion = useCallback(async () => {
    if (!isAuthenticated || !isActiveRef.current) return

    try {
      const { data } = await api.get<VersionResponse>('/system/version/')

      const authzChanged = lastAuthzVersion.current !== null &&
                           lastAuthzVersion.current !== data.authz_version

      const userChanged  = lastUserVersion.current !== null &&
                           lastUserVersion.current !== data.user_version

      // Atualiza referência local
      lastAuthzVersion.current = data.authz_version
      lastUserVersion.current  = data.user_version

      if (authzChanged || userChanged) {
        // Revalida permissões do usuário atual
        await globalMutate('/accounts/me/permissions/')
        // Força re-resolução da navegação
        bumpManifestVersion()
      }
    } catch {
      // Erros de rede não devem interromper o ciclo de polling
      // 401 será tratado pelo interceptor do axios (api.ts)
    }
  }, [isAuthenticated, bumpManifestVersion])

  useEffect(() => {
    if (!isAuthenticated) return

    const schedule = () => {
      timerRef.current = setTimeout(async () => {
        await checkVersion()
        if (isActiveRef.current) schedule() // agenda próximo ciclo
      }, POLLING_INTERVAL)
    }

    // Pausa polling quando aba está em background
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        isActiveRef.current = true
        // Verifica imediatamente ao retornar para a aba
        checkVersion().then(() => {
          if (isActiveRef.current) schedule()
        })
      } else {
        isActiveRef.current = false
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    // Inicia o ciclo com primeira verificação após o intervalo
    schedule()

    return () => {
      isActiveRef.current = false
      if (timerRef.current) clearTimeout(timerRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [isAuthenticated, checkVersion])
}
