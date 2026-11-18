import { describe, expect, it } from "vitest";

import manifestJson from "../../../public/nav/PUB_INSTITUCIONAL.json";
import { adaptNavigationMenus } from "@/lib/adaptNavigationMenus";
import {
  getNavigationFallback,
  resolveNavigation,
} from "@/lib/resolveNavigation";
import type {
  Menu,
  NavItemDefinition,
  NavManifestFile,
  NavigationMenusResponse,
} from "@/types/navigation";

const manifest = manifestJson as NavManifestFile;

const expectedItems = [
  ["PATRIARCAS_EDOCS", "/publicacoes/patriarcas", "view_patriarcaedocs"],
  ["COLETAS_EDOCS", "/publicacoes/coletas", "view_coletapatriarcasedocs"],
  [
    "DIVERGENCIAS_EDOCS",
    "/publicacoes/divergencias",
    "view_divergenciapatriarcaedocs",
  ],
  [
    "AUDITORIA_EDOCS",
    "/publicacoes/auditoria",
    "view_eventoauditoriapatriarcaedocs",
  ],
];

function findDefinition(
  codigo: string,
  items: NavItemDefinition[] = manifest.items,
): NavItemDefinition | undefined {
  for (const item of items) {
    if (item.codigo === codigo) return item;
    const child: NavItemDefinition | undefined =
      item.children && findDefinition(codigo, item.children);
    if (child) return child;
  }
  return undefined;
}

function backendMenu(codigo: string, children: Menu[] = []): Menu {
  const definition = findDefinition(codigo);
  if (!definition) throw new Error(`Item desconhecido: ${codigo}`);

  return {
    id: definition.order,
    codigo,
    nome: definition.label,
    descricao: "",
    rota: definition.href ?? null,
    icone: definition.icon,
    ordem: definition.order,
    ativo: true,
    aplicacao_codigo: "PUB_INSTITUCIONAL",
    parent: null,
    capability: {
      id: definition.order,
      codigo: `CAPABILITY_${codigo}`,
      nome: codigo,
      descricao: "",
      ativo: true,
      aplicacao_id: 4,
      aplicacao_codigo: "PUB_INSTITUCIONAL",
    },
    children,
  };
}

describe("manifesto de Publicações Institucionais", () => {
  it("relaciona os códigos e rotas contratados às permissões técnicas", () => {
    expect(
      manifest.items.slice(0, 4).map((item) => [
        item.codigo,
        item.href,
        item.permissionKey,
      ]),
    ).toEqual(expectedItems);
    expect(
      manifest.items.every(
        (item) =>
          item.app === "PUB_INSTITUCIONAL" && item.capabilityControlled === true,
      ),
    ).toBe(true);
  });

  it("reconhece o agrupador Coleta de Dados e a rota E-Flow", () => {
    const group = findDefinition("COLETA_DADOS");
    const eflow = findDefinition("COLETA_EFLOW");

    expect(group).toMatchObject({
      label: "Coleta de Dados",
      capabilityControlled: true,
    });
    expect(eflow).toMatchObject({
      href: "/publicacoes/coleta-dados/eflow",
      permissionKey: "view_coletaeflow",
      capabilityControlled: true,
    });
  });

  it("relaciona o menu mensal E-Docs sem materializá-lo fora da API dinâmica", () => {
    const monthly = findDefinition("COLETA_EDOCS_MENSAL");
    expect(monthly).toMatchObject({
      href: "/publicacoes/coleta-dados/edocs",
      permissionKey: "view_coletamensaledocs",
      capabilityControlled: true,
    });

    const response: NavigationMenusResponse = {
      app_context: "PUB_INSTITUCIONAL",
      items: [backendMenu("COLETA_DADOS", [backendMenu("COLETA_EDOCS_MENSAL")])],
    };
    const adapted = adaptNavigationMenus(response, manifest.items);
    expect(
      resolveNavigation(adapted, [], "PUB_INSTITUCIONAL")[0].children?.[0],
    ).toMatchObject({ visible: false, enabled: false });
    expect(
      resolveNavigation(
        adapted,
        ["view_coletamensaledocs"],
        "PUB_INSTITUCIONAL",
      )[0].children?.[0],
    ).toMatchObject({ visible: true, enabled: true });
  });

  it("falha fechado quando a API de capabilities não está disponível", () => {
    expect(getNavigationFallback(manifest.items)).toEqual([]);
  });

  it("não cria no navegador itens ausentes da resposta funcional do backend", () => {
    const response: NavigationMenusResponse = {
      app_context: "PUB_INSTITUCIONAL",
      items: [backendMenu("PATRIARCAS_EDOCS")],
    };

    const adapted = adaptNavigationMenus(response, manifest.items);

    expect(adapted.map((item) => item.codigo)).toEqual(["PATRIARCAS_EDOCS"]);
    expect(adapted.some((item) => item.codigo === "COLETAS_EDOCS")).toBe(false);
    expect(adapted.some((item) => item.codigo === "COLETA_DADOS")).toBe(false);
  });

  it("oculta o item quando falta a permissão técnica correspondente", () => {
    const response: NavigationMenusResponse = {
      app_context: "PUB_INSTITUCIONAL",
      items: [backendMenu("PATRIARCAS_EDOCS")],
    };
    const adapted = adaptNavigationMenus(response, manifest.items);

    expect(
      resolveNavigation(adapted, [], "PUB_INSTITUCIONAL")[0],
    ).toMatchObject({ enabled: false, visible: false });
    expect(
      resolveNavigation(
        adapted,
        ["view_patriarcaedocs"],
        "PUB_INSTITUCIONAL",
      )[0],
    ).toMatchObject({ enabled: true, visible: true });
  });

  it("mantém E-Flow oculto sem capability ou sem permissão técnica", () => {
    const withoutCapability = adaptNavigationMenus(
      { app_context: "PUB_INSTITUCIONAL", items: [] },
      manifest.items,
    );
    expect(withoutCapability).toEqual([]);

    const response: NavigationMenusResponse = {
      app_context: "PUB_INSTITUCIONAL",
      items: [backendMenu("COLETA_DADOS", [backendMenu("COLETA_EFLOW")])],
    };
    const adapted = adaptNavigationMenus(response, manifest.items);
    const denied = resolveNavigation(adapted, [], "PUB_INSTITUCIONAL");
    const allowed = resolveNavigation(
      adapted,
      ["view_coletaeflow"],
      "PUB_INSTITUCIONAL",
    );

    expect(denied[0].children?.[0]).toMatchObject({
      visible: false,
      enabled: false,
    });
    expect(allowed[0].children?.[0]).toMatchObject({
      visible: true,
      enabled: true,
    });
  });
});
