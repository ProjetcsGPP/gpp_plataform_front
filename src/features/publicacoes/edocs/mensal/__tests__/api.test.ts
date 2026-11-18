import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getTotaisResultadosMensaisPatriarcasEdocs,
  getTotaisHistoricosEdocs,
  listAuditoriaColetasMensaisEdocs,
  listColetasMensaisEdocs,
  listFontesBrutasColetasMensaisEdocs,
  listResultadosMensaisOrganizacoesEdocs,
  listResultadosMensaisPatriarcasEdocs,
  reencaminharColetaMensalEdocs,
  solicitarColetaMensalEdocs,
} from "@/features/publicacoes/edocs/mensal/api";
import api from "@/lib/api";

const page = { count: 0, next: null, previous: null, results: [] };

describe("API da coleta mensal E-Docs", () => {
  afterEach(() => vi.restoreAllMocks());

  it("usa os endpoints e parâmetros contratados", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: page });
    const detail = {
      coleta_id: "uuid",
      page: 1,
      page_size: 20,
      ordering: "nome",
    };

    await listColetasMensaisEdocs({
      page: 2,
      page_size: 10,
      ano: 2024,
      mes: 9,
      situacao: "SUCESSO",
      ordering: "-revisao",
    });
    await listResultadosMensaisPatriarcasEdocs(detail);
    await getTotaisResultadosMensaisPatriarcasEdocs("uuid");
    await listResultadosMensaisOrganizacoesEdocs({ ...detail, search: "SEGER" });
    await listFontesBrutasColetasMensaisEdocs(detail);
    await listAuditoriaColetasMensaisEdocs(detail);

    expect(get).toHaveBeenNthCalledWith(
      1,
      "/pub-institucional/coletas-mensais-edocs/",
      { params: expect.objectContaining({ ano: 2024, mes: 9, page: 2 }) },
    );
    expect(get).toHaveBeenNthCalledWith(
      2,
      "/pub-institucional/resultados-mensais-patriarcas-edocs/",
      { params: detail },
    );
    expect(get).toHaveBeenNthCalledWith(
      3,
      "/pub-institucional/resultados-mensais-patriarcas-edocs/totais/",
      { params: { coleta_id: "uuid" } },
    );
    expect(get).toHaveBeenNthCalledWith(
      4,
      "/pub-institucional/resultados-mensais-organizacoes-edocs/",
      { params: { ...detail, search: "SEGER" } },
    );
    expect(get).toHaveBeenNthCalledWith(
      5,
      "/pub-institucional/fontes-brutas-coletas-mensais-edocs/",
      { params: detail },
    );
    expect(get).toHaveBeenNthCalledWith(
      6,
      "/pub-institucional/auditoria-coletas-mensais-edocs/",
      { params: detail },
    );
  });

  it.each([
    [{ ano: 2024 }],
    [{}],
    [{ ano: 2024, patriarca_id: 25 }],
    [{ patriarca_id: 25 }],
  ])("consulta os quatro escopos de totais históricos com %o", async (query) => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: {} });

    await getTotaisHistoricosEdocs(query);

    expect(get).toHaveBeenCalledWith(
      "/pub-institucional/resultados-mensais-patriarcas-edocs/totais-historicos/",
      { params: query },
    );
  });

  it("solicita uma única competência sem payload adicional", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: { id: "uuid" } });

    await solicitarColetaMensalEdocs({ ano: 2024, mes: 9 });

    expect(post).toHaveBeenCalledWith(
      "/pub-institucional/coletas-mensais-edocs/",
      { ano: 2024, mes: 9 },
    );
  });

  it("reencaminha a revisão persistida sem enviar payload", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({
      data: { id: "uuid", situacao: "SOLICITADA" },
      status: 202,
    });

    await expect(reencaminharColetaMensalEdocs("uuid")).resolves.toEqual({
      id: "uuid",
      situacao: "SOLICITADA",
    });

    expect(post).toHaveBeenCalledWith(
      "/pub-institucional/coletas-mensais-edocs/uuid/reencaminhar/",
    );
  });
});
