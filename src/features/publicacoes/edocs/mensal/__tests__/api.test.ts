import { afterEach, describe, expect, it, vi } from "vitest";

import {
  listAuditoriaColetasMensaisEdocs,
  listColetasMensaisEdocs,
  listFontesBrutasColetasMensaisEdocs,
  listResultadosMensaisOrganizacoesEdocs,
  listResultadosMensaisPatriarcasEdocs,
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
      situacao: "CONCLUIDA",
      ordering: "-revisao",
    });
    await listResultadosMensaisPatriarcasEdocs(detail);
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
      "/pub-institucional/resultados-mensais-organizacoes-edocs/",
      { params: { ...detail, search: "SEGER" } },
    );
    expect(get).toHaveBeenNthCalledWith(
      4,
      "/pub-institucional/fontes-brutas-coletas-mensais-edocs/",
      { params: detail },
    );
    expect(get).toHaveBeenNthCalledWith(
      5,
      "/pub-institucional/auditoria-coletas-mensais-edocs/",
      { params: detail },
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
});
