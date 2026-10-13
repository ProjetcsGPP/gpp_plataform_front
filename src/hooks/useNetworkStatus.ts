// src/hooks/useNetworkStatus.ts
// Detecta estado de conectividade via navigator.onLine e eventos
// window online/offline.
//
// Uso principal: impedir logout falso no interceptor de 401 quando a
// rede cai momentaneamente — o cookie ainda é válido, mas a requisição
// não chegou ao servidor.
'use client'

import { useEffect, useState } from 'react'

/**
 * Retorna true se o browser acredita estar online.
 * Usa navigator.onLine como estado inicial e atualiza via eventos
 * window 'online' / 'offline'.
 *
 * Importante: navigator.onLine = true significa que há uma interface
 * de rede ativa, NÃO garante acesso real à internet. Para detecção
 * mais precisa, combine com um health-check leve ao backend.
 */
export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    const handleOnline  = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
