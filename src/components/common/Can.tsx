// src/components/common/Can.tsx
// Componente declarativo de controle de acesso por permissão.
//
// Uso:
//   <Can permission="user.change">
//     <Button>Editar</Button>
//   </Can>
//
//   <Can permission="user.delete" fallback={<span>Sem acesso</span>}>
//     <Button variant="destructive">Excluir</Button>
//   </Can>
//
// Regra de ouro: este componente NÃO decide regra de negócio.
// Ele apenas consome granted[] da permissionsStore.
'use client'

import { usePermissions } from '@/hooks/usePermissions'
import type { ReactNode } from 'react'

interface CanProps {
  /** Chave de permissão a verificar, ex: 'user.change', 'programas.view' */
  permission: string
  /** Conteúdo renderizado quando a permissão está concedida */
  children: ReactNode
  /**
   * Conteúdo renderizado quando a permissão está negada.
   * Se omitido, não renderiza nada.
   */
  fallback?: ReactNode
}

export function Can({ permission, children, fallback = null }: CanProps) {
  const { can, isLoading } = usePermissions()

  // Não renderizar enquanto as permissões não foram hidratadas do backend
  if (isLoading) return null

  return can(permission) ? <>{children}</> : <>{fallback}</>
}
