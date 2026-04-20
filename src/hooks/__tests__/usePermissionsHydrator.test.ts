// src/hooks/__tests__/usePermissionsHydrator.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { SWRConfig } from "swr";

const mockSetPermissions = vi.fn();
const mockClearPermissions = vi.fn();
const mockSetLoading = vi.fn();
const mockSetPermissionsForApp = vi.fn();
let mockIsAuthenticated = true;
let mockAppContext = "PORTAL";

vi.mock("@/store/authStore", () => ({
  useAuthStore: (sel: (s: object) => unknown) =>
    sel({ isAuthenticated: mockIsAuthenticated, appContext: mockAppContext }),
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
  default: { get: (...args: unknown[]) => mockApiGet(...args) },
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
  });

  describe("formato legado", () => {
    it("hidrata setPermissions e setPermissionsForApp com app atual", async () => {
      mockApiGet.mockResolvedValueOnce({
        data: { role: "PORTAL_ADMIN", granted: ["view_user"] },
      });

      const { usePermissionsHydrator } =
        await import("@/hooks/usePermissionsHydrator");
      renderHook(() => usePermissionsHydrator(), { wrapper });

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
      renderHook(() => usePermissionsHydrator(), { wrapper });

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
      renderHook(() => usePermissionsHydrator(), { wrapper });

      await waitFor(() => {
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
      renderHook(() => usePermissionsHydrator(), { wrapper });
      await waitFor(() => expect(mockClearPermissions).toHaveBeenCalled());
    });
  });

  describe("autenticação", () => {
    it("não executa quando isAuthenticated === false", async () => {
      mockIsAuthenticated = false;
      const { usePermissionsHydrator } =
        await import("@/hooks/usePermissionsHydrator");
      renderHook(() => usePermissionsHydrator(), { wrapper });
      expect(mockApiGet).not.toHaveBeenCalled();
    });
  });
});
