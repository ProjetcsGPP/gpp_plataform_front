// src/store/__tests__/permissionsStore.multiapp.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { usePermissionsStore } from "@/store/permissionsStore";
import type { AppContext } from "@/types/auth";

function getApp(
  state: ReturnType<typeof usePermissionsStore.getState>,
  app: AppContext,
) {
  return state.permissionsByApp[app] ?? { role: null, granted: [] };
}

describe("permissionsStore — multi-app", () => {
  beforeEach(() => {
    usePermissionsStore.setState({
      permissionsByApp: {},
    });
  });

  it("armazena permissões para PORTAL sem afetar outros apps", () => {
    usePermissionsStore
      .getState()
      .setPermissionsForApp("PORTAL", "ADMIN", ["view_user" as never]);

    const state = usePermissionsStore.getState();

    expect(getApp(state, "PORTAL").role).toBe("ADMIN");
    expect(getApp(state, "ACOES_PNGI").role).toBeNull();
    expect(getApp(state, "CARGA_ORG_LOT").role).toBeNull();
    expect(getApp(state, "PUB_INSTITUCIONAL").role).toBeNull();
  });

  it("isola as permissões de Publicações das demais aplicações", () => {
    usePermissionsStore.getState().setPermissionsForApp(
      "PUB_INSTITUCIONAL",
      "GESTOR_PUBLICACOES",
      ["view_patriarcaedocs"],
    );

    const state = usePermissionsStore.getState();

    expect(getApp(state, "PUB_INSTITUCIONAL")).toEqual({
      role: "GESTOR_PUBLICACOES",
      granted: ["view_patriarcaedocs"],
    });
    expect(getApp(state, "PORTAL").granted).toEqual([]);
  });

  it("armazena permissões para múltiplos apps simultaneamente", () => {
    const { setPermissionsForApp } = usePermissionsStore.getState();

    setPermissionsForApp("PORTAL", "ADMIN", ["view_user" as never]);
    setPermissionsForApp("ACOES_PNGI", "VIEWER", ["view_role" as never]);

    const state = usePermissionsStore.getState();

    expect(getApp(state, "PORTAL").role).toBe("ADMIN");
    expect(getApp(state, "ACOES_PNGI").role).toBe("VIEWER");
  });

  it("clearPermissions reseta permissionsByApp", () => {
    usePermissionsStore
      .getState()
      .setPermissionsForApp("PORTAL", "ADMIN", ["view_user" as never]);

    usePermissionsStore.getState().clearPermissions();

    const state = usePermissionsStore.getState();

    expect(getApp(state, "PORTAL").role).toBeNull();
    expect(getApp(state, "PORTAL").granted).toEqual([]);
  });
});
