// src/hooks/__tests__/usePermissionsHydrator.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { SWRConfig } from "swr";
import { debugLog } from "@/lib/debug";
import type { AppContext } from "@/types/auth";

const mockSetPermissions = vi.fn();
const mockClearPermissions = vi.fn();
const mockSetLoading = vi.fn();
const mockSetPermissionsForApp = vi.fn();
let mockIsAuthenticated = true;
let mockAppContext: AppContext = "PORTAL";

vi.mock("@/store/authStore", () => ({
  useAuthStore: Object.assign(
    (sel: (s: object) => unknown) =>
      sel({
        isAuthenticated: mockIsAuthenticated,
        appContext: mockAppContext,
      }),
    {
      getState: () => ({
        isAuthenticated: mockIsAuthenticated,
        appContext: mockAppContext,
      }),
    },
  ),
}));

vi.mock("@/store/permissionsStore", () => ({
  usePermissionsStore: (sel: (s: object) => unknown) =>
    sel({
      setPermissions: mockSetPermissions,
      clearPermissions: mockClearPermissions,
      setLoading: mockSetLoading,
      setPermissionsForApp: mockSetPermissionsForApp,
    }),
}));

const mockApiGet = vi.fn();

vi.mock("@/lib/api", () => ({
  default: {
    get: (...args: unknown[]) => {
      debugLog("test-permissions", "api.get chamado", { args });
      return mockApiGet(...args);
    },
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(
    SWRConfig,
    { value: { provider: () => new Map() } },
    children,
  );

describe("usePermissionsHydrator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = true;
    mockAppContext = "PORTAL";

    debugLog("test-permissions", "beforeEach", {
      isAuthenticated: mockIsAuthenticated,
      appContext: mockAppContext,
    });
  });

  describe("formato legado", () => {
    it("hidrata setPermissions e setPermissionsForApp com app atual", async () => {
      mockApiGet.mockResolvedValueOnce({
        data: { role: "PORTAL_ADMIN", granted: ["view_user"] },
      });

      debugLog("test-permissions", "legado: mockApiGet configurado", {
        response: {
          role: "PORTAL_ADMIN",
          granted: ["view_user"],
        },
      });

      const { usePermissionsHydrator } =
        await import("@/hooks/usePermissionsHydrator");
      renderHook(() => usePermissionsHydrator(mockAppContext), { wrapper });

      debugLog("test-permissions", "legado: após renderHook", {
        apiCalls: mockApiGet.mock.calls,
        setPermissionsCalls: mockSetPermissions.mock.calls,
        setPermissionsForAppCalls: mockSetPermissionsForApp.mock.calls,
        clearPermissionsCalls: mockClearPermissions.mock.calls,
      });

      await waitFor(() => {
        expect(mockSetPermissions).toHaveBeenCalledWith("PORTAL_ADMIN", [
          "view_user",
        ]);
        expect(mockSetPermissionsForApp).toHaveBeenCalledWith(
          "PORTAL",
          "PORTAL_ADMIN",
          ["view_user"],
        );
      });
    });
  });

  describe("formato multi-app", () => {
    it("itera apps[] e chama setPermissionsForApp para cada app", async () => {
      mockApiGet.mockResolvedValueOnce({
        data: {
          apps: [
            {
              codigo: "PORTAL",
              role: "PORTAL_ADMIN",
              permissions: ["view_user"],
            },
            {
              codigo: "ACOES_PNGI",
              role: "VIEWER",
              permissions: ["view_role"],
            },
          ],
        },
      });

      const { usePermissionsHydrator } =
        await import("@/hooks/usePermissionsHydrator");
      renderHook(() => usePermissionsHydrator(mockAppContext), { wrapper });

      await waitFor(() => {
        expect(mockSetPermissionsForApp).toHaveBeenCalledWith(
          "PORTAL",
          "PORTAL_ADMIN",
          ["view_user"],
        );
        expect(mockSetPermissionsForApp).toHaveBeenCalledWith(
          "ACOES_PNGI",
          "VIEWER",
          ["view_role"],
        );
      });
    });

    it("preenche setPermissions com o app atual quando multi-app", async () => {
      mockAppContext = "PORTAL";
      mockApiGet.mockResolvedValueOnce({
        data: {
          apps: [
            {
              codigo: "PORTAL",
              role: "PORTAL_ADMIN",
              permissions: ["view_user"],
            },
          ],
        },
      });

      const { usePermissionsHydrator } =
        await import("@/hooks/usePermissionsHydrator");
      renderHook(() => usePermissionsHydrator(mockAppContext), { wrapper });

      await waitFor(() => {
        debugLog("test-permissions", "legado: dentro do waitFor", {
          apiCalls: mockApiGet.mock.calls,
          setPermissionsCalls: mockSetPermissions.mock.calls,
          setPermissionsForAppCalls: mockSetPermissionsForApp.mock.calls,
          clearPermissionsCalls: mockClearPermissions.mock.calls,
        });

        expect(mockSetPermissions).toHaveBeenCalledWith("PORTAL_ADMIN", [
          "view_user",
        ]);
      });
    });
  });

  describe("comportamento de erro", () => {
    it("chama clearPermissions() quando o backend retorna erro", async () => {
      mockApiGet.mockRejectedValueOnce(new Error("401"));
      const { usePermissionsHydrator } =
        await import("@/hooks/usePermissionsHydrator");
      renderHook(() => usePermissionsHydrator(mockAppContext), { wrapper });
      await waitFor(() => expect(mockClearPermissions).toHaveBeenCalled());
    });
  });

  describe("autenticação", () => {
    it("não executa quando isAuthenticated === false", async () => {
      mockIsAuthenticated = false;
      const { usePermissionsHydrator } =
        await import("@/hooks/usePermissionsHydrator");
      renderHook(() => usePermissionsHydrator(mockAppContext), { wrapper });
      expect(mockApiGet).not.toHaveBeenCalled();
    });
  });

  it("consulta novamente ao trocar de aplicacao", async () => {
    mockApiGet
      .mockResolvedValueOnce({
        data: { role: "PORTAL_ADMIN", granted: ["view_user"] },
      })
      .mockResolvedValueOnce({
        data: { role: "CARGA_OPERADOR", granted: ["view_importacaoplanilha"] },
      });

    const { usePermissionsHydrator } =
      await import("@/hooks/usePermissionsHydrator");
    const { rerender } = renderHook(
      ({ appContext }) => usePermissionsHydrator(appContext),
      {
        initialProps: { appContext: "PORTAL" as AppContext },
        wrapper,
      },
    );

    await waitFor(() => expect(mockApiGet).toHaveBeenCalledTimes(1));

    rerender({ appContext: "CARGA_ORG_LOT" });

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledTimes(2);
      expect(mockSetPermissionsForApp).toHaveBeenCalledWith(
        "CARGA_ORG_LOT",
        "CARGA_OPERADOR",
        ["view_importacaoplanilha"],
      );
    });
  });
});
