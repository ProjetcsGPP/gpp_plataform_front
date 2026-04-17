// src/components/common/AppThemeProvider.tsx
'use client'

import { useEffect } from 'react'
import { useMe } from '@/hooks/useMe'
import { useNavigation } from '@/hooks/useNavigation'
import type { AppContext } from '@/types/auth'

interface AppThemeProviderProps {
  /** Contexto da app — define qual bloco [data-app] será aplicado no <body> */
  appContext: AppContext
  children: React.ReactNode
}

/**
 * Aplica o atributo data-app no <body> para ativar o tema CSS da aplicação.
 * Hidrata a authStore com os dados do usuário autenticado via useMe().
 * Carrega e resolve a navegação via useNavigation().
 * Deve envolver o conteúdo do layout de cada app.
 */
export function AppThemeProvider({ appContext, children }: AppThemeProviderProps) {
  // Hidrata a store com os dados do usuário autenticado
  useMe()

  // Carrega manifest de navegação + permissões e popula navigationStore
  useNavigation(appContext)

  useEffect(() => {
    document.body.setAttribute('data-app', appContext)

    // Cleanup: remove o atributo ao desmontar (ex: navegação entre apps no dev)
    return () => {
      document.body.removeAttribute('data-app')
    }
  }, [appContext])

  return <>{children}</>
}
