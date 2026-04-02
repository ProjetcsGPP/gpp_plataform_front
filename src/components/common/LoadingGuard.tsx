// src/components/common/LoadingGuard.tsx
'use client'

import { useAuthStore } from '@/store/authStore'

interface LoadingGuardProps {
  children: React.ReactNode
}

/**
 * Exibe um loader enquanto os dados do usuário estão sendo buscados.
 * Evita flash de conteúdo não autenticado.
 */
export function LoadingGuard({ children }: LoadingGuardProps) {
  const isLoading = useAuthStore((s) => s.isLoading)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app-gradient">
        <span className="material-symbols-outlined animate-spin text-white text-4xl">
          progress_activity
        </span>
      </div>
    )
  }

  return <>{children}</>
}
