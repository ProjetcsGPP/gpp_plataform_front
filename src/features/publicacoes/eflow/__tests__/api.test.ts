import { afterEach, describe, expect, it, vi } from "vitest";

import {
  alterarMinhaPreferenciaEflow,
  getMinhaPreferenciaEflow,
  importarColetaEflow,
  listAuditoriaEflow,
  listAuditoriaPreferenciaEflow,
  listColetasEflow,
  listDefinicoesEflow,
  listResultadosEflow,
} from "@/features/publicacoes/eflow/api";
import api from "@/lib/api";

const page = { count: 0, next: null, previous: null, results: [] };

describe("API administrativa E-Flow", () => {
  afterEach(() => vi.restoreAllMocks());

  it("envia multipart pelo Axios compartilhado sem definir Content-Type", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({
      data: { id: "coleta-1", situacao: "CONCLUIDA" },
    });
    const file = new File(["ID;Nome"], "eflow.csv", { type: "text/csv" });

    await importarColetaEflow(file);

    expect(post).toHaveBeenCalledTimes(1);
    const [url, body, config] = post.mock.calls[0];
    expect(url).toBe("/pub-institucional/coletas-eflow/");
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get("arquivo")).toBe(file);
    expect(config).toBeUndefined();
  });

  it("consulta coletas, definições e auditoria com paginação do backend", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: page });

    await listColetasEflow({ page: 2, page_size: 20, situacao: "CONCLUIDA", ordering: "-iniciada_em" });
    await listDefinicoesEflow({ page: 3, page_size: 10, coleta_id: "uuid", search: "SEGER", ordering: "nome" });
    await listAuditoriaEflow({ page: 1, page_size: 10, coleta_id: "uuid", tipo_evento: "COLETA_FALHOU", ordering: "-criado_em" });

    expect(get).toHaveBeenNthCalledWith(1, "/pub-institucional/coletas-eflow/", {
      params: { page: 2, page_size: 20, situacao: "CONCLUIDA", ordering: "-iniciada_em" },
    });
    expect(get).toHaveBeenNthCalledWith(2, "/pub-institucional/definicoes-eflow/", {
      params: { page: 3, page_size: 10, coleta_id: "uuid", search: "SEGER", ordering: "nome" },
    });
    expect(get).toHaveBeenNthCalledWith(3, "/pub-institucional/auditoria-eflow/", {
      params: { page: 1, page_size: 10, coleta_id: "uuid", tipo_evento: "COLETA_FALHOU", ordering: "-criado_em" },
    });
  });

  it("consulta resultados, preferência e auditoria individual pelos contratos dedicados", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: page });

    await listResultadosEflow({
      page: 1,
      page_size: 20,
      coleta_id: "uuid",
      perfil: "CONSOLIDADO_PUBLICACAO",
      ordering: "perfil",
    });
    await getMinhaPreferenciaEflow();
    await listAuditoriaPreferenciaEflow({
      page: 2,
      page_size: 10,
      ordering: "-criado_em",
    });

    expect(get).toHaveBeenNthCalledWith(1, "/pub-institucional/resultados-eflow/", {
      params: {
        page: 1,
        page_size: 20,
        coleta_id: "uuid",
        perfil: "CONSOLIDADO_PUBLICACAO",
        ordering: "perfil",
      },
    });
    expect(get).toHaveBeenNthCalledWith(
      2,
      "/pub-institucional/preferencias-eflow/minha/",
    );
    expect(get).toHaveBeenNthCalledWith(
      3,
      "/pub-institucional/auditoria-preferencias-eflow/",
      { params: { page: 2, page_size: 10, ordering: "-criado_em" } },
    );
  });

  it("altera a preferência por PATCH enviando somente o perfil", async () => {
    const patch = vi.spyOn(api, "patch").mockResolvedValue({
      data: { perfil_preferido: "COMPLETO_TECNICO" },
    });

    await alterarMinhaPreferenciaEflow("COMPLETO_TECNICO");

    expect(patch).toHaveBeenCalledWith(
      "/pub-institucional/preferencias-eflow/minha/",
      { perfil_preferido: "COMPLETO_TECNICO" },
    );
    expect(patch.mock.calls[0][1]).not.toHaveProperty("justificativa");
  });
});
