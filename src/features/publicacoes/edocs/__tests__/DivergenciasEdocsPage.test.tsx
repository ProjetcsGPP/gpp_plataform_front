import { SWRConfig } from "swr";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DivergenciasEdocsPage } from "@/features/publicacoes/edocs/DivergenciasEdocsPage";
import * as edocsApi from "@/features/publicacoes/edocs/api";
import type { DivergenciaPatriarcaEdocs } from "@/features/publicacoes/edocs/model";

vi.mock("@/components/common/RouteGuard", () => ({
  RouteGuard: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({ can: () => true }),
}));
vi.mock("@/features/publicacoes/edocs/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/publicacoes/edocs/api")>();
  return { ...original, listDivergenciasEdocs: vi.fn() };
});

const baseDivergence: DivergenciaPatriarcaEdocs = {
  id: 1,
  coleta_id: "64b5cc45-4db0-4f95-8903-e1b28c3c531c",
  patriarca_id: 7,
  id_externo: "externo-7",
  comparacao: "ALTERADO",
  situacao: "PENDENTE",
  dados_esperados: {},
  dados_observados: null,
  campos_alterados: [],
  decisao: "",
  justificativa: "",
  revisado_por_id: null,
  revisado_por_nome: "",
  revisado_em: null,
  criado_em: "2026-11-09T10:00:00-03:00",
  decisoes_permitidas: [],
  acoes_disponiveis: [],
};

describe("Divergências E-Docs", () => {
  beforeEach(() => vi.clearAllMocks());

  it("exibe sigla e nome das evidências observadas ou esperadas", async () => {
    vi.mocked(edocsApi.listDivergenciasEdocs).mockResolvedValue({
      count: 2,
      next: null,
      previous: null,
      results: [
        {
          ...baseDivergence,
          dados_observados: { sigla: "SEGER", nome: "Secretaria de Gestão" },
        },
        {
          ...baseDivergence,
          id: 2,
          id_externo: "externo-8",
          comparacao: "AUSENTE",
          dados_esperados: { sigla: "SEP", nome: "Secretaria de Economia" },
        },
      ],
    });

    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <DivergenciasEdocsPage />
      </SWRConfig>,
    );

    expect(await screen.findByText("SEGER")).toBeInTheDocument();
    expect(screen.getByText("Secretaria de Gestão")).toBeInTheDocument();
    expect(screen.getByText("SEP")).toBeInTheDocument();
    expect(screen.getByText("Secretaria de Economia")).toBeInTheDocument();
  });
});
