import { AxiosError, AxiosHeaders } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import api from "@/lib/api";
import { clearPublicConditionalCache, getCurrentPublicPublication, getPublicPublicationSeries, listPublicPublications } from "../api";
import { publicPublication } from "./fixtures";

describe("API de distribuição pública", () => {
  beforeEach(() => { vi.restoreAllMocks(); clearPublicConditionalCache(); });

  it("usa o Axios compartilhado sem cookies, sessão ou endpoint administrativo", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: publicPublication, status: 200, headers: {} });
    await getCurrentPublicPublication();
    expect(get).toHaveBeenCalledWith("/public/v1/publicacoes-institucionais/vigente/", expect.objectContaining({ adapter: "fetch", withCredentials: false, gppAuthMode: "public", gppBlockUi: false }));
    expect(get.mock.calls[0][0]).not.toContain("pub-institucional");
    expect(get.mock.calls[0][0]).not.toContain("previa");
  });

  it("revalida por ETag e reutiliza a representação em 304", async () => {
    const get = vi.spyOn(api, "get")
      .mockResolvedValueOnce({ data: publicPublication, status: 200, headers: { etag: '"v1"', "last-modified": "Mon, 01 Jul 2024 10:00:00 GMT" } })
      .mockResolvedValueOnce({ data: "", status: 304, headers: { etag: '"v1"' } });
    expect(await getCurrentPublicPublication()).toBe(publicPublication);
    expect(await getCurrentPublicPublication()).toBe(publicPublication);
    expect(get.mock.calls[1][1]).toEqual(expect.objectContaining({ headers: expect.objectContaining({ "If-None-Match": '"v1"', "If-Modified-Since": "Mon, 01 Jul 2024 10:00:00 GMT" }) }));
  });

  it.each([[429, "LIMITE_PUBLICO_EXCEDIDO", "12", 12], [503, "PUBLICACAO_TEMPORARIAMENTE_INDISPONIVEL", undefined, null]] as const)("preserva o erro público %s", async (status, code, retry, expectedRetry) => {
    const config = { headers: new AxiosHeaders() } as never;
    vi.spyOn(api, "get").mockRejectedValue(new AxiosError("failure", "ERR_BAD_RESPONSE", config, undefined, { data: { codigo: code, detalhe: "Mensagem pública" }, status, statusText: "Error", headers: retry ? { "retry-after": retry } : {}, config }));
    await expect(getCurrentPublicPublication()).rejects.toMatchObject({ code, status, retryAfter: expectedRetry, message: "Mensagem pública" });
  });

  it("classifica falha de conexão como offline", async () => {
    vi.spyOn(api, "get").mockRejectedValue(new AxiosError("network"));
    vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(false);
    await expect(listPublicPublications()).rejects.toMatchObject({ code: "OFFLINE" });
  });

  it("expõe o endpoint público próprio de séries", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: { ...publicPublication, secoes: [] }, status: 200, headers: {} });
    await getPublicPublicationSeries(publicPublication.id);
    expect(get.mock.calls[0][0]).toBe(`/public/v1/publicacoes-institucionais/${publicPublication.id}/series/`);
  });
});
