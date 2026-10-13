import { afterEach, describe, expect, it, vi } from "vitest";

import {
  EIXOS_ENDPOINT,
  eixoApi,
} from "@/features/acoes-pngi/configuracoes/eixos/api";
import api from "@/lib/api";

const eixo = {
  ideixo: 1,
  strdescricaoeixo: "Transformação Digital",
  stralias: "TD",
  created_by_id: 1,
  created_by_name: "Usuário",
  updated_by_id: 1,
  updated_by_name: "Usuário",
  created_at: "2026-10-09T10:00:00-03:00",
  updated_at: "2026-10-09T10:00:00-03:00",
};

describe("API de eixos", () => {
  afterEach(() => vi.restoreAllMocks());

  it("lista com paginação e ordenação explicitamente mapeada", async () => {
    const payload = { count: 1, next: null, previous: null, results: [eixo] };
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: payload });

    await expect(
      eixoApi.list({
        page: 2,
        pageSize: 20,
        sorting: [{ key: "updatedAt", direction: "desc" }],
      }),
    ).resolves.toEqual(payload);
    expect(get).toHaveBeenCalledWith(EIXOS_ENDPOINT, {
      params: { page: 2, page_size: 20, ordering: "-updated_at" },
    });
  });

  it("executa detalhe, inclusão e alteração no endpoint do recurso", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: eixo });
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: eixo });
    const patch = vi.spyOn(api, "patch").mockResolvedValue({ data: eixo });
    const payload = {
      strdescricaoeixo: "Transformação Digital",
      stralias: "TD",
    };

    await eixoApi.detail(1);
    await eixoApi.create(payload);
    await eixoApi.update(1, payload);

    expect(get).toHaveBeenCalledWith("/acoes-pngi/eixos/1/");
    expect(post).toHaveBeenCalledWith(EIXOS_ENDPOINT, payload);
    expect(patch).toHaveBeenCalledWith("/acoes-pngi/eixos/1/", payload);
  });
});
