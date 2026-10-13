import { afterEach, describe, expect, it, vi } from "vitest";

import {
  SITUACOES_ACAO_ENDPOINT,
  situacaoAcaoApi,
} from "@/features/acoes-pngi/configuracoes/situacoes/api";
import api from "@/lib/api";

const situacao = {
  idsituacaoacao: 1,
  strdescricaosituacao: "Em andamento",
  created_by_id: 1,
  created_by_name: "Usuário",
  updated_by_id: 1,
  updated_by_name: "Usuário",
  created_at: "2026-10-09T10:00:00-03:00",
  updated_at: "2026-10-09T10:00:00-03:00",
};

describe("API de situações", () => {
  afterEach(() => vi.restoreAllMocks());

  it("lista com paginação e ordenação explicitamente mapeada", async () => {
    const payload = {
      count: 1,
      next: null,
      previous: null,
      results: [situacao],
    };
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: payload });

    await expect(
      situacaoAcaoApi.list({
        page: 2,
        pageSize: 20,
        sorting: [{ key: "updatedAt", direction: "desc" }],
      }),
    ).resolves.toEqual(payload);
    expect(get).toHaveBeenCalledWith(SITUACOES_ACAO_ENDPOINT, {
      params: { page: 2, page_size: 20, ordering: "-updated_at" },
    });
  });

  it("executa detalhe, inclusão e alteração no endpoint do recurso", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: situacao });
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: situacao });
    const patch = vi.spyOn(api, "patch").mockResolvedValue({ data: situacao });
    const payload = { strdescricaosituacao: "Em andamento" };

    await situacaoAcaoApi.detail(1);
    await situacaoAcaoApi.create(payload);
    await situacaoAcaoApi.update(1, payload);

    expect(get).toHaveBeenCalledWith("/acoes-pngi/situacoes/1/");
    expect(post).toHaveBeenCalledWith(SITUACOES_ACAO_ENDPOINT, payload);
    expect(patch).toHaveBeenCalledWith("/acoes-pngi/situacoes/1/", payload);
  });
});
