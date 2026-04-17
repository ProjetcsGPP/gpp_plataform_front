// src/store/permissionsStore.ts
// Store central de permissões RBAC.
// Fonte de verdade: GET /api/accounts/me/permissions/?app={APP}
// O frontend NUNCA calcula permissões — apenas consome granted[] do backend.

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface PermissionsState {
  role: string | null
  granted: string[]
  isLoading: boolean
  isHydrated: boolean

  setPermissions: (role: string, granted: string[]) => void
  clearPermissions: () => void
  setLoading: (loading: boolean) => void

  // Helper central: verificar se uma permissão está concedida
  can: (permission: string) => boolean
}

export const usePermissionsStore = create<PermissionsState>()(
  devtools(
    (set, get) => ({
      role: null,
      granted: [],
      isLoading: true,
      isHydrated: false,

      setPermissions: (role, granted) =>
        set(
          { role, granted, isLoading: false, isHydrated: true },
          false,
          'permissions/set'
        ),

      clearPermissions: () =>
        set(
          { role: null, granted: [], isLoading: true, isHydrated: false },
          false,
          'permissions/clear'
        ),

      setLoading: (isLoading) =>
        set({ isLoading }, false, 'permissions/setLoading'),

      can: (permission) => get().granted.includes(permission),
    }),
    {
      name: 'gpp-permissions-store',
      enabled: process.env.NODE_ENV === 'development',
      serialize: true,
    }
  )
)
