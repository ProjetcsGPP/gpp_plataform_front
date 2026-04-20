// src/store/permissionsStore.ts
// Store central de permissões RBAC.
//
// REGRA ARQUITETURAL:
//   Store = APENAS DADOS (role, granted, flags de estado)
//   PROIBIDO: qualquer método de lógica de permissão aqui
//   Use buildPermissionContext (domain service) ou usePermissions (hook)

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { AppContext } from "@/types/auth";
import type { PermissionKey } from "@/lib/permissions";

/** Estado por aplicação — usado pela estrutura multi-app */
export interface AppPermissionsSlice {
  role: string | null;
  granted: PermissionKey[];
}

const EMPTY_APP_SLICE: AppPermissionsSlice = {
  role: null,
  granted: [] as PermissionKey[],
};

/** Estado inicial do mapa multi-app */
const initialPermissionsByApp: Partial<
  Record<AppContext, AppPermissionsSlice>
> = {};

export interface PermissionsState {
  // ── legado (single-app) — MANTIDOS para compatibilidade ──
  role: string | null;
  granted: PermissionKey[];
  isLoading: boolean;
  isHydrated: boolean;

  // ── multi-app — NOVO ──────────────────────────────────────
  permissionsByApp: Partial<Record<AppContext, AppPermissionsSlice>>;

  // ── actions ───────────────────────────────────────────────
  setPermissions: (role: string | null, granted: PermissionKey[]) => void;
  clearPermissions: () => void;
  setLoading: (loading: boolean) => void;
  /** NOVO — grava permissões para uma app específica */
  setPermissionsForApp: (
    app: AppContext,
    role: string | null,
    granted: PermissionKey[],
  ) => void;
}

export const usePermissionsStore = create<PermissionsState>()(
  devtools(
    (set) => ({
      // legado
      role: null,
      granted: [] as PermissionKey[],
      isLoading: true,
      isHydrated: false,

      // multi-app
      permissionsByApp: { ...initialPermissionsByApp },

      setPermissions: (role, granted) =>
        set(
          { role, granted, isLoading: false, isHydrated: true },
          false,
          "permissions/set",
        ),

      clearPermissions: () =>
        set(
          {
            role: null,
            granted: [] as PermissionKey[],
            isLoading: true,
            isHydrated: false,
            permissionsByApp: { ...initialPermissionsByApp },
          },
          false,
          "permissions/clear",
        ),

      setLoading: (isLoading) =>
        set({ isLoading }, false, "permissions/setLoading"),

      // NOVO
      setPermissionsForApp: (app, role, granted) =>
        set(
          (state) => ({
            permissionsByApp: {
              ...state.permissionsByApp,
              [app]: { role, granted },
            },
          }),
          false,
          `permissions/setForApp/${app}`,
        ),
    }),
    {
      name: "gpp-permissions-store",
      enabled: process.env.NODE_ENV === "development",
      serialize: true,
    },
  ),
);
