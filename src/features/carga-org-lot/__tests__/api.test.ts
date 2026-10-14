import axios from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createPatriarca,
  createItemOrganograma,
  deleteImportacao,
  deleteItemOrganograma,
  downloadArquivo,
  getValidationReport,
  getSheetSelectionReport,
  latestOrganogramaUrl,
  listItensOrganograma,
  listImportacoes,
  listPatriarcas,
  updatePatriarca,
  updateItemOrganograma,
  uploadImportacao,
} from "@/features/carga-org-lot/api";
import api from "@/lib/api";

describe("API de carga de organograma e lotação", () => {
  afterEach(() => vi.restoreAllMocks());

  it("lista patriarcas com a ordenação padrão", async () => {
    const payload = { count: 0, next: null, previous: null, results: [] };
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: payload });
    await expect(listPatriarcas()).resolves.toEqual(payload);
    expect(get).toHaveBeenCalledWith("/carga-org-lot/patriarcas/", {
      params: { ordering: "strsiglapatriarca,idpatriarca" },
    });
  });

  it("cria e edita patriarcas com o contrato do backend", async () => {
    const payload = { idexternopatriarca: "uuid", strsiglapatriarca: "PMBG", strnome: "Prefeitura", idstatusprogresso_id: 1 };
    const updatePayload = { idexternopatriarca: "uuid", strsiglapatriarca: "PMBG", strnome: "Prefeitura" };
    const result = { idpatriarca: 1, ...payload };
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: result });
    const patch = vi.spyOn(api, "patch").mockResolvedValue({ data: result });
    await createPatriarca(payload);
    await updatePatriarca(1, updatePayload);
    expect(post).toHaveBeenCalledWith("/carga-org-lot/patriarcas/", payload);
    expect(patch).toHaveBeenCalledWith("/carga-org-lot/patriarcas/1/", updatePayload);
  });

  it("lista organogramas e lotações com tipo e ordenação corretos", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: { results: [] } });
    await listImportacoes(8, 3);
    await listImportacoes(8, 4);
    expect(get).toHaveBeenNthCalledWith(1, "/carga-org-lot/importacoes/", { params: { patriarca: 8, tipo_carga: 3, ordering: "-datimportacao,-idimportacaoplanilha" } });
    expect(get).toHaveBeenNthCalledWith(2, "/carga-org-lot/importacoes/", { params: { patriarca: 8, tipo_carga: 4, ordering: "-datimportacao,-idimportacaoplanilha" } });
  });

  it("lista os itens lidos de uma versão do organograma", async () => {
    const items = [{ iditemorganograma: 1, idpai_id: null }];
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: { count: 1, next: null, previous: null, results: items } });
    await expect(listItensOrganograma(7)).resolves.toEqual(items);
    expect(get).toHaveBeenCalledWith("/carga-org-lot/itens-organograma/", {
      params: {
        importacao: 7,
        ordering: "strnumero,intlinhaorigem,iditemorganograma",
        page_size: 100,
      },
    });
  });

  it("busca todas as páginas de itens do organograma", async () => {
    const get = vi.spyOn(api, "get")
      .mockResolvedValueOnce({ data: { count: 101, next: "?page=2", previous: null, results: Array.from({ length: 100 }, (_, index) => ({ iditemorganograma: index + 1 })) } })
      .mockResolvedValueOnce({ data: { count: 101, next: null, previous: "?page=1", results: [{ iditemorganograma: 101 }] } });
    await expect(listItensOrganograma(7)).resolves.toHaveLength(101);
    expect(get).toHaveBeenNthCalledWith(2, "/carga-org-lot/itens-organograma/", {
      params: {
        importacao: 7,
        ordering: "strnumero,intlinhaorigem,iditemorganograma",
        page_size: 100,
        page: 2,
      },
    });
  });

  it("envia multipart sem definir Content-Type ou boundary", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: {} });
    const file = new File(["planilha"], "organograma.xlsx");
    await uploadImportacao(2, 3, file);
    const [url, form, config] = post.mock.calls[0];
    expect(url).toBe("/carga-org-lot/importacoes/upload/");
    expect(form).toBeInstanceOf(FormData);
    expect((form as FormData).get("idpatriarca_id")).toBe("2");
    expect((form as FormData).get("idtipocarga_id")).toBe("3");
    expect((form as FormData).get("arquivo")).toBe(file);
    expect(config).not.toHaveProperty("headers");
  });

  it("reenvia organograma com aba usando o mesmo File e sem headers manuais", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: {} });
    const file = new File(["planilha"], "organograma.xlsx");
    await uploadImportacao(2, 3, file, { aba: "Organograma" });
    const [, form, config] = post.mock.calls[0];
    expect((form as FormData).get("arquivo")).toBe(file);
    expect((form as FormData).get("aba")).toBe("Organograma");
    expect((form as FormData).has("idimportacaoorganograma_id")).toBe(false);
    expect(config).not.toHaveProperty("headers");
  });

  it("envia lotação simples ou em pacote vinculada ao organograma sem aba", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: {} });
    const file = new File(["planilha"], "lotacao.xlsx");
    await uploadImportacao(2, 4, file, { organogramaId: 10 });
    await uploadImportacao(2, 5, file, { organogramaId: 10, aba: "Ignorada" });
    for (const [, form, config] of post.mock.calls) {
      expect((form as FormData).get("idimportacaoorganograma_id")).toBe("10");
      expect((form as FormData).has("aba")).toBe(false);
      expect(config).not.toHaveProperty("headers");
    }
  });

  it("reconhece somente o contrato 409 de seleção de aba", () => {
    const report = { codigo: "selecao_aba_obrigatoria", mensagem: "Selecione", abas: [{ nome: "Org", ordem: 1, linhas_preenchidas: 10 }] };
    const conflict = new axios.AxiosError("conflict", "ERR_BAD_RESPONSE", undefined, undefined, { status: 409, data: { errors: { arquivo: report } } } as never);
    expect(getSheetSelectionReport(conflict)).toEqual(report);
    expect(getSheetSelectionReport(new Error("falha"))).toBeNull();
  });

  it("usa os endpoints de CRUD de itens e exclusão da importação", async () => {
    const payload = { idimportacaoplanilha_id: 7, idpai_id: null, strnome: "Prefeitura", strsigla: "PM", strnumero: "1", strreferenciapai: "", strabaorigem: "Org", intlinhaorigem: 2 };
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: { iditemorganograma: 9, ...payload } });
    const patch = vi.spyOn(api, "patch").mockResolvedValue({ data: { iditemorganograma: 9, ...payload } });
    const remove = vi.spyOn(api, "delete").mockResolvedValue({});
    await createItemOrganograma(payload);
    await updateItemOrganograma(9, { strnome: "Prefeitura Municipal" });
    await deleteItemOrganograma(9);
    await deleteImportacao(7);
    expect(post).toHaveBeenCalledWith("/carga-org-lot/itens-organograma/", payload);
    expect(patch).toHaveBeenCalledWith("/carga-org-lot/itens-organograma/9/", { strnome: "Prefeitura Municipal" });
    expect(remove).toHaveBeenNthCalledWith(1, "/carga-org-lot/itens-organograma/9/");
    expect(remove).toHaveBeenNthCalledWith(2, "/carga-org-lot/importacoes/7/");
  });

  it("extrai integralmente o relatório estruturado e ignora erros genéricos", () => {
    const report = { codigo: "planilha_invalida", mensagem: "Arquivo rejeitado", leitura_completa: true, total_abas_lidas: 2, total_linhas_lidas: 303, total_erros: 2, erros: [{ codigo: "duplicado", mensagem: "Duplicado", aba: "Org", linha: 15, campo: "sigla" }] };
    const structured = new axios.AxiosError("bad", "ERR_BAD_REQUEST", undefined, undefined, { data: { errors: { arquivo: report } }, status: 400 } as never);
    expect(getValidationReport(structured)).toEqual(report);
    expect(getValidationReport(new Error("falha"))).toBeNull();
  });

  it("baixa Blob pelo download_url usando Content-Disposition", async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    vi.spyOn(api, "get").mockResolvedValue({ data: new Blob(["x"]), headers: { "content-disposition": 'attachment; filename="org.xlsx"' } });
    await expect(downloadArquivo("https://api.test/download/", "fallback.xlsx")).resolves.toBe("org.xlsx");
    expect(api.get).toHaveBeenCalledWith("https://api.test/download/", { responseType: "blob" });
    expect(click).toHaveBeenCalled();
  });

  it("monta a rota determinística do organograma mais recente", () => {
    expect(latestOrganogramaUrl(9)).toBe("/carga-org-lot/patriarcas/9/organograma/download/");
  });
});
