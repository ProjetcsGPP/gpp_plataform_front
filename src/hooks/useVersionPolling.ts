// src/hooks/useVersionPolling.ts
// Polling de versão para detectar mudanças de permissão em tempo real.
//
// Fluxo:
//   GET /api/system/version/ a cada POLLING_INTERVAL ms
//   Se authz_version mudou (comparado com authStore) → revalida /me e /permissions
//
// Nota: usa validateStatus para aceitar 404 silenciosamente enquanto
//   o endpoint ainda não está implementado no backend.
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { mutate as globalMutate } from 'swr'

import { useAuthStore } from '@/store/authStore'
import { useNavigationStore } from '@/store/navigationStore'
import api from '@/lib/api'

/** Intervalo de polling em ms (30 segundos) */
const POLLING_INTERVAL = 30_000

interface VersionResponse {
  authz_version?: number
  user_version?: number
}

export function useVersionPolling() {
  const isAuthenticated     = useAuthStore((s) => s.isAuthenticated)
  const authzVersion        = useAuthStore((s) => s.authzVersion)
  const bumpManifestVersion = useNavigationStore((s) => s.bumpManifestVersion)

  const lastAuthzVersion = useRef<number | null>(null)
  const lastUserVersion  = useRef<number | null>(null)
  const timerRef         = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isActiveRef      = useRef(true)
  const isCheckingRef    = useRef(false)

  const checkVersion = useCallback(async () => {
    if (!isAuthenticated || !isActiveRef.current || isCheckingRef.current) return

    isCheckingRef.current = true

    try {
      // validateStatus: aceita qualquer status HTTP sem lançar erro de rede.
      // Isso impede que o interceptor de 401/404 poluam o console enquanto
      // o endpoint /system/version/ ainda não está disponível no backend.
      const { data, status } = await api.get<VersionResponse>('/system/version/', {
        validateStatus: () => true,
      })

      // Endpoint ainda não implementado — ignora silenciosamente
      if (status !== 200 || typeof data?.authz_version !== 'number') {
        return
      }

      const authzChanged =
        lastAuthzVersion.current !== null &&
        lastAuthzVersion.current !== data.authz_version

      const userChanged =
        lastUserVersion.current !== null &&
        data.user_version !== undefined &&
        lastUserVersion.current !== data.user_version

      lastAuthzVersion.current = data.authz_version
      if (data.user_version !== undefined) {
        lastUserVersion.current = data.user_version
      }

      if (authzChanged || userChanged) {
        await Promise.all([
          globalMutate('/accounts/me/'),
          globalMutate('/accounts/me/permissions/'),
        ])
        bumpManifestVersion()
      }
    } catch {
      // Erros de rede não interrompem o ciclo
    } finally {
      isCheckingRef.current = false
    }
  }, [isAuthenticated, authzVersion, bumpManifestVersion])

  useEffect(() => {
    if (!isAuthenticated) return

    const schedule = () => {
      timerRef.current = setTimeout(async () => {
        await checkVersion()
        if (isActiveRef.current) schedule()
      }, POLLING_INTERVAL)
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        isActiveRef.current = true
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
    schedule()

    return () => {
      isActiveRef.current = false
      if (timerRef.current) clearTimeout(timerRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [isAuthenticated, checkVersion])
}
