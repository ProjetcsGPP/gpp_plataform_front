import { describe, expect, it } from "vitest";

import manifestJson from "../../../public/nav/PUB_INSTITUCIONAL.json";
import { adaptNavigationMenus } from "@/lib/adaptNavigationMenus";
import {
  getNavigationFallback,
  resolveNavigation,
} from "@/lib/resolveNavigation";
import type {
  Menu,
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

function backendMenu(codigo: string): Menu {
  const definition = manifest.items.find((item) => item.codigo === codigo);
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
    children: [],
  };
}

describe("manifesto de Publicações Institucionais", () => {
  it("relaciona os códigos e rotas contratados às permissões técnicas", () => {
    expect(
      manifest.items.map((item) => [
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
});
