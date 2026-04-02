// src/components/common/AppThemeProvider.tsx
'use client'

import { useEffect } from 'react'
import type { AppContext } from '@/types/auth'

interface AppThemeProviderProps {
  /** Contexto da app — define qual bloco [data-app] será aplicado no <body> */
  appContext: AppContext
  children: React.ReactNode
}

/**
 * Aplica o atributo data-app no <body> para ativar o tema CSS da aplicação.
 * Deve envolver o conteúdo do layout de cada app.
 *
 * Nota: a hidratação da authStore (useMe) será adicionada na Fase 5.
 */
export function AppThemeProvider({ appContext, children }: AppThemeProviderProps) {
  useEffect(() => {
    document.body.setAttribute('data-app', appContext)

    // Cleanup: remove o atributo ao desmontar (ex: navegação entre apps no dev)
    return () => {
      document.body.removeAttribute('data-app')
    }
  }, [appContext])

  return <>{children}</>
}
