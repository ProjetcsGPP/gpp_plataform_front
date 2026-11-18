import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MapasSecaoPublicacao } from "../GestaoPublicacoesPage";
import type { SecaoPublicacao } from "../model";
import { frozenMap } from "@/features/publicacoes/mapa/__tests__/model.test";

vi.mock("@/components/common/MapaMunicipalPublicacao", () => ({
  MapaMunicipalPublicacao: ({ mapa }: { mapa: typeof frozenMap }) => <div data-testid="publication-map">{mapa.titulo} · {mapa.competencia}</div>,
}));

const section: SecaoPublicacao = {
  id: "section-1",
  ordem: 1,
  titulo: "Resultados E-Docs",
  fonte: "EDOCS",
  configuracao_visao_id: "view-1",
  coleta_edocs_id: "collection-1",
  coleta_eflow_id: null,
  perfil_calculo: "MUNICIPIOS",
  configuracao_congelada: {},
  resultado: {},
  calculada_em: "2026-11-12T10:00:00Z",
  hash_resultado: "hash",
};

describe("snapshot cartográfico da publicação", () => {
  it("exibe diretamente o mapa congelado na seção", () => {
    render(<MapasSecaoPublicacao section={{ ...section, resultado: { mapas: [frozenMap] } }} />);
    expect(screen.getByTestId("publication-map")).toHaveTextContent("Implantação do E-Docs nos municípios · 2026-10");
  });

  it("não cria mapa para publicação antiga sem o campo mapas", () => {
    const { container } = render(<MapasSecaoPublicacao section={section} />);
    expect(container).toBeEmptyDOMElement();
  });
});
