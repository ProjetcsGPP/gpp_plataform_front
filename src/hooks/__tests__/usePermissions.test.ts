// src/hooks/__tests__/usePermissions.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePermissions } from "@/hooks/usePermissions";
import { usePermissionsStore } from "@/store/permissionsStore";
import { useAuthStore } from "@/store/authStore";
import { PERMISSIONS } from "@/lib/permissions";

function setContext(
  app: "PORTAL" | "ACOES_PNGI" | "CARGA_ORG_LOT" | null,
  role: string | null,
  granted: string[],
) {
  useAuthStore.setState({ appContext: app });
  if (app) {
    usePermissionsStore.setState((s) => ({
      permissionsByApp: {
        ...s.permissionsByApp,
        [app]: { role, granted },
      },
      isHydrated: true,
      isLoading: false,
    }));
  }
}

describe("usePermissions", () => {
  beforeEach(() => {
    useAuthStore.setState({ appContext: null });
    usePermissionsStore.setState({
      role: null,
      granted: [],
      isLoading: false,
      isHydrated: false,
      permissionsByApp: {
        PORTAL: { role: null, granted: [] },
        ACOES_PNGI: { role: null, granted: [] },
        CARGA_ORG_LOT: { role: null, granted: [] },
      },
    });
  });

  describe("fallback seguro", () => {
    it("retorna role=null e granted=[] quando appContext é null", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.role).toBeNull();
      expect(result.current.granted).toEqual([]);
      expect(result.current.can(PERMISSIONS.USER_VIEW)).toBe(false);
    });
  });

  describe("integração com AppContext", () => {
    it("retorna permissões do app ativo", () => {
      act(() => setContext("PORTAL", "ADMIN", [PERMISSIONS.USER_VIEW]));
      const { result } = renderHook(() => usePermissions());
      expect(result.current.role).toBe("ADMIN");
      expect(result.current.can(PERMISSIONS.USER_VIEW)).toBe(true);
      expect(result.current.can(PERMISSIONS.USER_DELETE)).toBe(false);
    });

    it("troca de appContext altera permissões imediatamente", () => {
      act(() => {
        setContext("PORTAL", "ADMIN", [PERMISSIONS.USER_VIEW]);
        setContext("ACOES_PNGI", "VIEWER", [PERMISSIONS.USER_DELETE]);
      });

      act(() => useAuthStore.setState({ appContext: "PORTAL" }));
      const { result } = renderHook(() => usePermissions());
      expect(result.current.can(PERMISSIONS.USER_VIEW)).toBe(true);
      expect(result.current.can(PERMISSIONS.USER_DELETE)).toBe(false);

      act(() => useAuthStore.setState({ appContext: "ACOES_PNGI" }));
      expect(result.current.can(PERMISSIONS.USER_VIEW)).toBe(false);
      expect(result.current.can(PERMISSIONS.USER_DELETE)).toBe(true);
    });

    it("isolamento: permissões de PORTAL não vazam para ACOES_PNGI", () => {
      act(() => {
        setContext("PORTAL", "ADMIN", [PERMISSIONS.USER_VIEW]);
        useAuthStore.setState({ appContext: "ACOES_PNGI" });
      });
      const { result } = renderHook(() => usePermissions());
      expect(result.current.can(PERMISSIONS.USER_VIEW)).toBe(false);
    });
  });

  describe("flags de estado", () => {
    it("expõe isLoading e isHydrated corretamente", () => {
      act(() => {
        usePermissionsStore.setState({ isLoading: true, isHydrated: false });
      });
      const { result } = renderHook(() => usePermissions());
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isHydrated).toBe(false);
    });
  });

  describe("has / hasAny / hasAll", () => {
    beforeEach(() => {
      act(() =>
        setContext("PORTAL", "ADMIN", [
          PERMISSIONS.USER_VIEW,
          PERMISSIONS.USER_ADD,
        ]),
      );
      act(() => useAuthStore.setState({ appContext: "PORTAL" }));
    });

    it("can funciona corretamente", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.can(PERMISSIONS.USER_VIEW)).toBe(true);
      expect(result.current.can(PERMISSIONS.USER_DELETE)).toBe(false);
    });

    it("hasAny funciona corretamente", () => {
      const { result } = renderHook(() => usePermissions());
      expect(
        result.current.hasAny([PERMISSIONS.USER_DELETE, PERMISSIONS.USER_VIEW]),
      ).toBe(true);
      expect(
        result.current.hasAny([
          PERMISSIONS.USER_DELETE,
          PERMISSIONS.USER_CHANGE,
        ]),
      ).toBe(false);
    });

    it("hasAll funciona corretamente", () => {
      const { result } = renderHook(() => usePermissions());
      expect(
        result.current.hasAll([PERMISSIONS.USER_VIEW, PERMISSIONS.USER_ADD]),
      ).toBe(true);
      expect(
        result.current.hasAll([PERMISSIONS.USER_VIEW, PERMISSIONS.USER_DELETE]),
      ).toBe(false);
    });
  });
});
