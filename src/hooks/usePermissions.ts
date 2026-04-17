// src/hooks/usePermissions.ts
// Hook central de autorização RBAC para o frontend.
//
// Uso:
//   const { can, role, granted, isLoading } = usePermissions()
//   can('user.change')  -> boolean
//
// Anti-pattern proibido: duplicar lógica de permissão em componentes.
// Todo guard de UI deve usar este hook ou o componente <Can>.
'use client'

import { usePermissionsStore } from '@/store/permissionsStore'

export function usePermissions() {
  const role       = usePermissionsStore((s) => s.role)
  const granted    = usePermissionsStore((s) => s.granted)
  const isLoading  = usePermissionsStore((s) => s.isLoading)
  const isHydrated = usePermissionsStore((s) => s.isHydrated)
  const canFn      = usePermissionsStore((s) => s.can)

  return {
    /** Role efetiva do usuário na aplicação atual */
    role,
    /** Lista de permissões concedidas (materializada pelo backend) */
    granted,
    isLoading,
    isHydrated,
    /**
     * Verifica se a permissão está em granted[].
     * Nunca usa lógica local — apenas consulta a store.
     *
     * @example can('user.change')
     */
    can: canFn,
  }
}
