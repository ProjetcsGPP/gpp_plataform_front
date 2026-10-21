import { SWRConfig } from "swr";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProcessoAtivoPanel } from "@/features/carga-org-lot/ProcessoAtivoPanel";
import * as cargaApi from "@/features/carga-org-lot/api";

vi.mock("@/features/carga-org-lot/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/carga-org-lot/api")>();
  return { ...original, listProcessosCargaInicial: vi.fn() };
});

describe("processo ativo do patriarca", () => {
  beforeEach(() => {
    vi.mocked(cargaApi.listProcessosCargaInicial).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [{
        idprocessocargainicial: 1,
        idpatriarca_id: 9,
        strfaseatual: "PREPARANDO_LOTACOES",
        fase_nome: "Preparando lotações",
        strstatusorganograma: "DISPONIVEL",
        status_organograma_nome: "Disponível",
        strstatuslotacao: "DESATUALIZADA",
        status_lotacao_nome: "Desatualizada",
        flgativo: true,
        databertura: "2026-10-14T12:00:00Z",
        dataconclusao: null,
        historico: [{
          idhistoricoprocesso: 2,
          stracao: "ORGANOGRAMA_INCORPORADO",
          strfaseanterior: "PREPARANDO_ORGANOGRAMA",
          strfasenova: "PREPARANDO_LOTACOES",
          strstatusorganogramaanterior: "EM_PREPARACAO",
          strstatusorganogramanovo: "DISPONIVEL",
          strstatuslotacaoanterior: "ATUALIZADA",
          strstatuslotacaonovo: "DESATUALIZADA",
          strmensagem: "Nova versão de organograma incorporada.",
          jsondetalhes: {},
          created_by_name: "Operador",
          created_at: "2026-10-15T09:00:00Z",
        }],
      }],
    });
  });

  it("exibe descrições, alerta de desatualização e histórico cronológico", async () => {
    render(<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}><ProcessoAtivoPanel patriarcaId={9} /></SWRConfig>);
    expect(await screen.findByText("Lotações desatualizadas")).toBeInTheDocument();
    expect(screen.getAllByText("Preparando lotações").length).toBeGreaterThan(0);
    expect(screen.getByText("Disponível")).toBeInTheDocument();
    expect(screen.getByText("Desatualizada")).toBeInTheDocument();
    expect(screen.getByText("Nova versão de organograma incorporada.")).toBeInTheDocument();
    expect(screen.getByText("Operador")).toBeInTheDocument();
    expect(cargaApi.listProcessosCargaInicial).toHaveBeenCalledWith(9);
  });
});
