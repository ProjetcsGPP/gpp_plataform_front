// src/store/permissionsStore.ts
// Store central de permissões RBAC.
// Fonte de verdade: GET /api/accounts/me/permissions/?app={APP}
//
// REGRA ARQUITETURAL:
//   Store = APENAS DADOS (role, granted, flags de estado)
//   PROIBIDO: qualquer método de lógica de permissão aqui
//   Use buildPermissionContext (domain service) ou usePermissions (hook)

import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface PermissionsState {
  role: string | null;
  granted: string[];
  isLoading: boolean;
  isHydrated: boolean;

  setPermissions: (role: string, granted: string[]) => void;
  clearPermissions: () => void;
  setLoading: (loading: boolean) => void;
}

export const usePermissionsStore = create<PermissionsState>()(
  devtools(
    (set) => ({
      role: null,
      granted: [],
      isLoading: true,
      isHydrated: false,

      setPermissions: (role, granted) =>
        set(
          { role, granted, isLoading: false, isHydrated: true },
          false,
          "permissions/set",
        ),

      clearPermissions: () =>
        set(
          { role: null, granted: [], isLoading: true, isHydrated: false },
          false,
          "permissions/clear",
        ),

      setLoading: (isLoading) =>
        set({ isLoading }, false, "permissions/setLoading"),
    }),
    {
      name: "gpp-permissions-store",
      enabled: process.env.NODE_ENV === "development",
      serialize: true,
    },
  ),
);
