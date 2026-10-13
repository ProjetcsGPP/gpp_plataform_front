import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useNavigation } from "@/hooks/useNavigation";
import { useAuthStore } from "@/store/authStore";
import { useNavigationStore } from "@/store/navigationStore";
import { usePermissionsStore } from "@/store/permissionsStore";
import type { NavManifestFile, NavigationMenusResponse } from "@/types/navigation";

const states = vi.hoisted(() => ({
  menus: {
    data: undefined as NavigationMenusResponse | undefined,
    error: undefined as Error | undefined,
    isLoading: true,
  },
  manifest: {
    data: undefined as NavManifestFile | undefined,
    error: undefined as Error | undefined,
    isLoading: true,
  },
}));

vi.mock("@/hooks/useNavigationMenus", () => ({
  useNavigationMenus: () => states.menus,
}));

vi.mock("swr", () => ({
  default: () => states.manifest,
}));

const staticManifest: NavManifestFile = {
  items: [
    {
      id: "dashboard",
      codigo: "DASHBOARD",
      label: "Dashboard estático",
      icon: "dashboard",
      app: "PORTAL",
      href: "/portal/dashboard",
      order: 1,
    },
  ],
};

function dynamicResponse(items = [{
  id: 1,
  codigo: "DASHBOARD",
  nome: "Dashboard da API",
  descricao: "",
  rota: "/portal",
  icone: "home",
  ordem: 1,
  ativo: true,
  aplicacao_codigo: "PORTAL" as const,
  parent: null,
  capability: null,
  children: [],
}]): NavigationMenusResponse {
  return { app_context: "PORTAL", items };
}

describe("useNavigation", () => {
  beforeEach(() => {
    states.menus.data = undefined;
    states.menus.error = undefined;
    states.menus.isLoading = true;
    states.manifest.data = staticManifest;
    states.manifest.error = undefined;
    states.manifest.isLoading = false;

    useAuthStore.setState({ appContext: "PORTAL", isAuthenticated: true });
    usePermissionsStore.setState({
      isLoading: false,
      permissionsByApp: {
        PORTAL: { role: "USER", granted: [] },
        ACOES_PNGI: { role: "USER", granted: [] },
      },
    });
    useNavigationStore.setState({
      appContext: null,
      items: [],
      role: null,
      isLoading: true,
      manifestVersion: 0,
    });
  });

  it("mantém o estado de loading enquanto a API está pendente", async () => {
    renderHook(() => useNavigation());

    await waitFor(() => {
      expect(useNavigationStore.getState()).toMatchObject({
        appContext: "PORTAL",
        items: [],
        isLoading: true,
      });
    });
  });

  it("usa o fallback estático quando a API falha", async () => {
    states.menus.error = new Error("indisponível");
    states.menus.isLoading = false;

    renderHook(() => useNavigation());

    await waitFor(() => {
      expect(useNavigationStore.getState().items[0]?.label).toBe(
        "Dashboard estático",
      );
      expect(useNavigationStore.getState().isLoading).toBe(false);
    });
  });

  it("respeita uma resposta vazia sem substituí-la pelo fallback", async () => {
    states.menus.data = dynamicResponse([]);
    states.menus.isLoading = false;

    renderHook(() => useNavigation());

    await waitFor(() => {
      expect(useNavigationStore.getState().items).toEqual([]);
      expect(useNavigationStore.getState().isLoading).toBe(false);
    });
  });

  it("recusa resposta de outro appContext e usa o fallback atual", async () => {
    states.menus.data = {
      ...dynamicResponse(),
      app_context: "ACOES_PNGI",
    };
    states.menus.isLoading = false;

    renderHook(() => useNavigation());

    await waitFor(() => {
      expect(useNavigationStore.getState().items[0]?.label).toBe(
        "Dashboard estático",
      );
    });
  });

  it("remove itens anteriores imediatamente ao trocar de appContext", async () => {
    states.menus.data = dynamicResponse();
    states.menus.isLoading = false;
    const { rerender } = renderHook(() => useNavigation());

    await waitFor(() => {
      expect(useNavigationStore.getState().items[0]?.label).toBe(
        "Dashboard da API",
      );
    });

    states.menus.data = undefined;
    states.menus.isLoading = true;
    act(() => {
      useAuthStore.setState({ appContext: "ACOES_PNGI" });
    });
    rerender();

    await waitFor(() => {
      expect(useNavigationStore.getState()).toMatchObject({
        appContext: "ACOES_PNGI",
        items: [],
        isLoading: true,
      });
    });
  });
});
