import { describe, expect, it } from "vitest";

import manifest from "../../../public/nav/CARGA_ORG_LOT.json";
import { adaptNavigationMenus } from "@/lib/adaptNavigationMenus";
import { getNavigationFallback, resolveNavigation } from "@/lib/resolveNavigation";
import type { NavItemDefinition, NavigationMenusResponse } from "@/types/navigation";

describe("manifest CARGA_ORG_LOT", () => {
  it("contém somente os quatro códigos e contratos atuais", () => {
    expect(manifest.items.map((item) => item.codigo)).toEqual(["DASHBOARD", "PATRIARCA", "ORGANOGRAMA", "LOTACAO"]);
    expect(manifest.items.map((item) => item.href)).toEqual(["/carga-org-lot/dashboard", "/carga-org-lot/patriarcas", "/carga-org-lot/organogramas", "/carga-org-lot/lotacoes"]);
    expect(manifest.items.find((item) => item.codigo === "PATRIARCA")?.permissionKey).toBe("view_patriarca");
    expect(manifest.items.filter((item) => ["ORGANOGRAMA", "LOTACAO"].includes(item.codigo)).every((item) => item.permissionKey === "view_importacaoplanilha")).toBe(true);
  });

  it("enriquece menus dinâmicos pelos novos códigos sem converter capability em permissão", () => {
    const response: NavigationMenusResponse = { app_context: "CARGA_ORG_LOT", items: manifest.items.map((item, index) => ({ id: index + 1, codigo: item.codigo, nome: item.label, descricao: "", rota: item.href ?? null, icone: item.icon, ordem: item.order, ativo: true, aplicacao_codigo: "CARGA_ORG_LOT", parent: null, capability: item.codigo === "DASHBOARD" ? null : item.codigo, children: [] })) };
    const result = adaptNavigationMenus(
      response,
      manifest.items as NavItemDefinition[],
    );
    expect(result.map((item) => item.permissionKey)).toEqual([undefined, "view_patriarca", "view_importacaoplanilha", "view_importacaoplanilha"]);
  });

  it("combina distribuição por capability com autorização técnica", () => {
    const items = manifest.items as NavItemDefinition[];
    expect(getNavigationFallback(items).map((item) => item.codigo)).toEqual([
      "DASHBOARD",
    ]);
    const resolved = resolveNavigation(items, ["view_patriarca"], "CARGA_ORG_LOT");
    expect(resolved.find((item) => item.codigo === "PATRIARCA")).toMatchObject({ visible: true, enabled: true });
    expect(resolved.find((item) => item.codigo === "ORGANOGRAMA")).toMatchObject({ visible: false, enabled: false });
  });
});
