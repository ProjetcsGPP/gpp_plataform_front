import { afterEach, describe, expect, it, vi } from "vitest";

import {
  alterarIndicadoresMunicipaisEdocs,
  alterarSelecaoColetaEdocs,
  decidirDivergenciaEdocs,
  listAuditoriaEdocs,
  listColetasEdocs,
  listDivergenciasEdocs,
  listPatriarcasEdocs,
  solicitarColetaEdocs,
} from "@/features/publicacoes/edocs/api";
import api from "@/lib/api";

const page = { count: 0, next: null, previous: null, results: [] };

describe("API administrativa E-Docs", () => {
  afterEach(() => vi.restoreAllMocks());

  it("lista as quatro áreas pelo prefixo compartilhado", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: page });
    const common = { page: 1, page_size: 20 };

    await listPatriarcasEdocs({ ...common, search: "SEGER", ativo: true });
    await listColetasEdocs({ ...common, situacao: "CONCLUIDA" });
    await listDivergenciasEdocs({ ...common, situacao: "PENDENTE" });
    await listAuditoriaEdocs({ ...common, tipo_evento: "COLETA_CONCLUIDA" });

    expect(get).toHaveBeenNthCalledWith(1, "/pub-institucional/patriarcas/", {
      params: { ...common, search: "SEGER", ativo: true },
    });
    expect(get).toHaveBeenNthCalledWith(2, "/pub-institucional/coletas/", {
      params: { ...common, situacao: "CONCLUIDA" },
    });
    expect(get).toHaveBeenNthCalledWith(3, "/pub-institucional/divergencias/", {
      params: { ...common, situacao: "PENDENTE" },
    });
    expect(get).toHaveBeenNthCalledWith(4, "/pub-institucional/auditoria/", {
      params: { ...common, tipo_evento: "COLETA_CONCLUIDA" },
    });
  });

  it("envia exatamente os payloads contratados nas mutações", async () => {
    const patch = vi.spyOn(api, "patch").mockResolvedValue({ data: { id: 7 } });
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: { id: "uuid" } });
    const selection = {
      coletar_detalhes: true,
      justificativa: "Incluído na coleta mensal.",
    };
    const decision = {
      decisao: "ADICIONAR",
      justificativa: "Cadastro confirmado.",
      coletar_detalhes: true,
    };

    await alterarSelecaoColetaEdocs(7, selection);
    await alterarIndicadoresMunicipaisEdocs(7, {
      codigo_municipio: 3201100,
      municipio_implantado: true,
      justificativa: "Situação confirmada.",
    });
    await solicitarColetaEdocs();
    await decidirDivergenciaEdocs(9, decision);

    expect(patch).toHaveBeenCalledWith(
      "/pub-institucional/patriarcas/7/selecao-coleta/",
      selection,
    );
    expect(patch).toHaveBeenNthCalledWith(
      2,
      "/pub-institucional/patriarcas/7/indicadores-municipais/",
      {
        codigo_municipio: 3201100,
        municipio_implantado: true,
        justificativa: "Situação confirmada.",
      },
    );
    expect(post).toHaveBeenNthCalledWith(1, "/pub-institucional/coletas/");
    expect(post).toHaveBeenNthCalledWith(
      2,
      "/pub-institucional/divergencias/9/decidir/",
      decision,
    );
  });
});
