import axios from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  addImportacaoConjuntoLotacao,
  ativarConjuntoLotacao,
  cancelarConjuntoLotacao,
  createPatriarca,
  createInitialOrganograma,
  createItemOrganograma,
  getAcompanhamentoEnvioOrganograma,
  getCargaOrgLotDashboard,
  consultarRelatorioEnvioOrganogramaProdest,
  consultarStatusEnvioOrganogramaProdest,
  deleteImportacao,
  deleteItemOrganograma,
  downloadArquivo,
  getImpactoExclusaoItem,
  getResumoConjuntosOrganograma,
  getResumoConjuntosLotacao,
  getResumoPendencias,
  getConfiguracaoProdest,
  getConjuntoLotacao,
  getImportacao,
  getRelatorioImportacao,
  getValidationReport,
  getSheetSelectionReport,
  getSubtreeConfirmationImpact,
  homologarConjuntoLotacao,
  latestOrganogramaUrl,
  pendenciasImportacaoDownloadUrl,
  listCargasRecentesProdest,
  listConjuntosLotacao,
  listEnviosOrganogramaProdest,
  listEventosEnvioOrganograma,
  listHistoricoConjuntoLotacao,
  listItensOrganograma,
  listItensLotacaoImportados,
  listItensLotacao,
  listItensLotacaoDescartados,
  listCasosValidacao,
  listImportacoes,
  listProcessosCargaInicial,
  listPatriarcas,
  solicitarEnvioOrganogramaProdest,
  testarConexaoProdest,
  updatePatriarca,
  updateItemOrganograma,
  uploadImportacao,
  resolveCasoValidacao,
  incorporarLotacao,
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

  it("usa os contratos de revisão e incorporação de lotações", async () => {
    const page = { count: 1, next: null, previous: null, results: [{ iditemlotacaoimportado: 123 }] };
    const resolved = { idcasovalidacao: 9, strstatus: "CORRIGIDO" };
    const incorporated = { idimportacaoplanilha: 21, strstatusimportacao: "INCORPORADA" };
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: page });
    const post = vi.spyOn(api, "post")
      .mockResolvedValueOnce({ data: resolved })
      .mockResolvedValueOnce({ data: incorporated });
    const payload = {
      acao: "CORRIGIR_MANUALMENTE" as const,
      alteracoes: [{ iditemlotacaoimportado: 123, campos: { strnomeservidor: "MARIA DA SILVA" } }],
    };

    await expect(listItensLotacaoImportados(21)).resolves.toEqual(page.results);
    await expect(resolveCasoValidacao(9, payload)).resolves.toEqual(resolved);
    await expect(incorporarLotacao(21)).resolves.toEqual(incorporated);

    expect(get).toHaveBeenCalledWith("/carga-org-lot/itens-lotacao-importados/", {
      params: {
        importacao: 21,
        page_size: 100,
        ordering: "strabaorigem,intlinhaorigem,iditemlotacaoimportado",
      },
    });
    expect(post).toHaveBeenNthCalledWith(1, "/carga-org-lot/casos-validacao-importacao/9/resolver/", payload);
    expect(post).toHaveBeenNthCalledWith(2, "/carga-org-lot/importacoes/21/incorporar-lotacao/", {});
  });

  it("consulta conjuntos e adiciona planilha sem headers multipart manuais", async () => {
    const page = { count: 0, next: null, previous: null, results: [] };
    const summary = { idimportacaoorganograma: 7, conjunto_ativo: null };
    const imported = { idimportacaoplanilha: 21, strtipooperacaolotacao: "ACRESCIMO" };
    const get = vi.spyOn(api, "get")
      .mockResolvedValueOnce({ data: page })
      .mockResolvedValueOnce({ data: summary });
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: imported });
    const file = new File(["planilha"], "complemento.xlsx");

    await expect(
      listConjuntosLotacao({ organograma: 7, page_size: 100 }),
    ).resolves.toEqual(page);
    await expect(getResumoConjuntosOrganograma(7)).resolves.toEqual(summary);
    await expect(
      addImportacaoConjuntoLotacao(31, file, " Complemento RH "),
    ).resolves.toEqual(imported);

    expect(get).toHaveBeenNthCalledWith(1, "/carga-org-lot/conjuntos-lotacao/", {
      params: {
        ordering: "-created_at,-idconjuntolotacao",
        organograma: 7,
        page_size: 100,
      },
    });
    expect(get).toHaveBeenNthCalledWith(
      2,
      "/carga-org-lot/conjuntos-lotacao/resumo-organograma/",
      { params: { organograma: 7 } },
    );
    const [url, form, config] = post.mock.calls[0];
    expect(url).toBe("/carga-org-lot/conjuntos-lotacao/31/importacoes/");
    expect(form).toBeInstanceOf(FormData);
    expect((form as FormData).get("arquivo")).toBe(file);
    expect((form as FormData).get("idtipocarga_id")).toBe("4");
    expect((form as FormData).get("strreferencia")).toBe("Complemento RH");
    expect(config).toBeUndefined();
  });

  it("usa o contrato de detalhe, histórico e transições dos conjuntos", async () => {
    const conjunto = { idconjuntolotacao: 31, strsituacao: "HOMOLOGADO" };
    const history = { count: 0, next: null, previous: null, results: [] };
    const get = vi.spyOn(api, "get")
      .mockResolvedValueOnce({ data: conjunto })
      .mockResolvedValueOnce({ data: history });
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: conjunto });

    await getConjuntoLotacao(31);
    await listHistoricoConjuntoLotacao(31, { page: 2 });
    await homologarConjuntoLotacao(31, "Conferido.");
    await ativarConjuntoLotacao(31, "Versão vigente.");
    await cancelarConjuntoLotacao(31, "Revisão solicitada.");

    expect(get).toHaveBeenNthCalledWith(
      1,
      "/carga-org-lot/conjuntos-lotacao/31/",
    );
    expect(get).toHaveBeenNthCalledWith(
      2,
      "/carga-org-lot/conjuntos-lotacao/31/historico/",
      { params: { page: 2 } },
    );
    expect(post).toHaveBeenNthCalledWith(
      1,
      "/carga-org-lot/conjuntos-lotacao/31/homologar/",
      { justificativa: "Conferido." },
    );
    expect(post).toHaveBeenNthCalledWith(
      2,
      "/carga-org-lot/conjuntos-lotacao/31/ativar/",
      { justificativa: "Versão vigente." },
    );
    expect(post).toHaveBeenNthCalledWith(
      3,
      "/carga-org-lot/conjuntos-lotacao/31/cancelar/",
      { justificativa: "Revisão solicitada." },
    );
  });

  it("usa os contratos das consultas operacionais de lotação", async () => {
    const page = { count: 0, next: null, previous: null, results: [] };
    const summary = { total_conjuntos: 0, por_situacao: [] };
    const pendingSummary = { total: 0, por_assunto: [] };
    const get = vi.spyOn(api, "get")
      .mockResolvedValueOnce({ data: summary })
      .mockResolvedValueOnce({ data: page })
      .mockResolvedValueOnce({ data: pendingSummary })
      .mockResolvedValueOnce({ data: page })
      .mockResolvedValueOnce({ data: page });

    await getResumoConjuntosLotacao({ patriarca: 1 });
    await listCasosValidacao({ patriarca: 1, status: "PENDENTE" });
    await getResumoPendencias({ patriarca: 1 });
    await listItensLotacao({ patriarca: 1, vigente: true });
    await listItensLotacaoDescartados({ patriarca: 1 });

    expect(get).toHaveBeenNthCalledWith(1, "/carga-org-lot/conjuntos-lotacao/resumo/", { params: { patriarca: 1 } });
    expect(get).toHaveBeenNthCalledWith(2, "/carga-org-lot/casos-validacao-importacao/", { params: { patriarca: 1, status: "PENDENTE" } });
    expect(get).toHaveBeenNthCalledWith(3, "/carga-org-lot/casos-validacao-importacao/resumo/", { params: { patriarca: 1 } });
    expect(get).toHaveBeenNthCalledWith(4, "/carga-org-lot/itens-lotacao/", { params: { patriarca: 1, vigente: true } });
    expect(get).toHaveBeenNthCalledWith(5, "/carga-org-lot/itens-lotacao-importados/descartados/", { params: { patriarca: 1 } });
  });

  it("cria o organograma inicial por JSON e omite referência vazia", async () => {
    const result = { idimportacaoplanilha: 17, strstatusimportacao: "INCORPORADA" };
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: result });

    await expect(createInitialOrganograma(8, " Estrutura inicial padrão ")).resolves.toEqual(result);
    await createInitialOrganograma(8, "   ");

    expect(post).toHaveBeenNthCalledWith(
      1,
      "/carga-org-lot/importacoes/criar-organograma-inicial/",
      { idpatriarca_id: 8, strreferencia: "Estrutura inicial padrão" },
    );
    expect(post).toHaveBeenNthCalledWith(
      2,
      "/carga-org-lot/importacoes/criar-organograma-inicial/",
      { idpatriarca_id: 8 },
    );
  });

  it("consulta o processo ativo do patriarca com a ordenação do backend", async () => {
    const payload = { count: 0, next: null, previous: null, results: [] };
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: payload });
    await expect(listProcessosCargaInicial(8)).resolves.toEqual(payload);
    expect(get).toHaveBeenCalledWith("/carga-org-lot/processos-carga-inicial/", {
      params: { patriarca: 8, ativo: true, ordering: "-databertura,-idprocessocargainicial" },
    });
  });

  it("usa o contrato dos envios de organograma para a PRODEST", async () => {
    const envio = { idenvioorganograma: 15 };
    const page = { count: 1, next: null, previous: null, results: [envio] };
    const get = vi.spyOn(api, "get")
      .mockResolvedValueOnce({ data: page })
      .mockResolvedValueOnce({ data: { cargas: [] } })
      .mockResolvedValueOnce({ data: { configurado: true } });
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: envio });

    await listEnviosOrganogramaProdest(8, { page: 2, page_size: 20 });
    await solicitarEnvioOrganogramaProdest(123, true);
    await consultarStatusEnvioOrganogramaProdest(15);
    await consultarRelatorioEnvioOrganogramaProdest(15);
    await listCargasRecentesProdest(8, 99);
    await getConfiguracaoProdest();
    await testarConexaoProdest();

    expect(get).toHaveBeenNthCalledWith(1, "/carga-org-lot/envios-organograma-prodest/", {
      params: { patriarca: 8, ordering: "-datsolicitacao,-idenvioorganograma", page: 2, page_size: 20 },
    });
    expect(post).toHaveBeenNthCalledWith(1, "/carga-org-lot/envios-organograma-prodest/", {
      idimportacaoplanilha_id: 123,
      dry_run: true,
    });
    expect(post).toHaveBeenNthCalledWith(2, "/carga-org-lot/envios-organograma-prodest/15/consultar-status/");
    expect(post).toHaveBeenNthCalledWith(3, "/carga-org-lot/envios-organograma-prodest/15/consultar-relatorio/");
    expect(get).toHaveBeenNthCalledWith(2, "/carga-org-lot/envios-organograma-prodest/ultimas-prodest/", {
      params: { patriarca: 8, limit: 10 },
    });
    expect(get).toHaveBeenNthCalledWith(3, "/carga-org-lot/envios-organograma-prodest/configuracao/");
    expect(post).toHaveBeenNthCalledWith(4, "/carga-org-lot/envios-organograma-prodest/testar-conexao/");
  });

  it("consulta acompanhamento, eventos incrementais e dashboard somente no backend local", async () => {
    const acompanhamento = { patriarca_id: 8, tentativa_ativa: null };
    const eventos = { idenvioorganograma: 15, ultimo_evento_id: 154, possui_mais: false, eventos: [] };
    const dashboard = { resumo: {}, processos_em_andamento: [] };
    const get = vi.spyOn(api, "get")
      .mockResolvedValueOnce({ data: acompanhamento })
      .mockResolvedValueOnce({ data: eventos })
      .mockResolvedValueOnce({ data: dashboard });

    await expect(getAcompanhamentoEnvioOrganograma(8)).resolves.toEqual(acompanhamento);
    await expect(listEventosEnvioOrganograma(15, 150, 500)).resolves.toEqual(eventos);
    await expect(getCargaOrgLotDashboard()).resolves.toEqual(dashboard);

    expect(get).toHaveBeenNthCalledWith(
      1,
      "/carga-org-lot/envios-organograma-prodest/acompanhamento/",
      { params: { patriarca: 8 } },
    );
    expect(get).toHaveBeenNthCalledWith(
      2,
      "/carga-org-lot/envios-organograma-prodest/15/eventos/",
      { params: { after_id: 150, limit: 100, visibilidade: "OPERACIONAL" } },
    );
    expect(get).toHaveBeenNthCalledWith(3, "/carga-org-lot/dashboard/");
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
    await uploadImportacao(2, 3, file, { referencia: " Estrutura 2026 " });
    const [url, form, config] = post.mock.calls[0];
    expect(url).toBe("/carga-org-lot/importacoes/upload/");
    expect(form).toBeInstanceOf(FormData);
    expect((form as FormData).get("idpatriarca_id")).toBe("2");
    expect((form as FormData).get("idtipocarga_id")).toBe("3");
    expect((form as FormData).get("arquivo")).toBe(file);
    expect((form as FormData).get("strreferencia")).toBe("Estrutura 2026");
    expect((form as FormData).get("criar_unidades_espelho")).toBe("false");
    expect(config).not.toHaveProperty("headers");
  });

  it("reenvia organograma com aba usando o mesmo File e sem headers manuais", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: {} });
    const file = new File(["planilha"], "organograma.xlsx");
    await uploadImportacao(2, 3, file, {
      aba: "Organograma",
      criarUnidadesEspelho: true,
    });
    const [, form, config] = post.mock.calls[0];
    expect((form as FormData).get("arquivo")).toBe(file);
    expect((form as FormData).get("aba")).toBe("Organograma");
    expect((form as FormData).get("criar_unidades_espelho")).toBe("true");
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
    const payload = { idimportacaoplanilha_id: 7, idpai_id: null, strnome: "Prefeitura", strsigla: "PM", strnumero: "1", strresponsavel: "Maria da Silva", strcargo: "Prefeita" };
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

  it("consulta impacto e confirma explicitamente a exclusão de subárvore", async () => {
    const impacto = { unidade_raiz: { iditemorganograma: 9 }, total_descendentes: 2, total_excluidos: 3, unidades: [] };
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: impacto });
    const remove = vi.spyOn(api, "delete").mockResolvedValue({});
    await expect(getImpactoExclusaoItem(9)).resolves.toEqual(impacto);
    await deleteItemOrganograma(9, true);
    expect(get).toHaveBeenCalledWith("/carga-org-lot/itens-organograma/9/impacto-exclusao/");
    expect(remove).toHaveBeenCalledWith("/carga-org-lot/itens-organograma/9/", { params: { confirmar_subarvore: true } });
  });

  it("trata o 409 de subárvore como pedido de confirmação", () => {
    const impacto = { total_descendentes: 2, total_excluidos: 3, unidades: [] };
    const conflict = new axios.AxiosError("conflict", "ERR_BAD_RESPONSE", undefined, undefined, { status: 409, data: { errors: { code: "confirmacao_exclusao_subarvore_obrigatoria", impacto } } } as never);
    expect(getSubtreeConfirmationImpact(conflict)).toEqual(impacto);
    expect(getSubtreeConfirmationImpact(new Error("falha"))).toBeNull();
  });

  it("consulta uma importação para atualizar status e downloads", async () => {
    const payload = { idimportacaoplanilha: 17, flgpossuialteracoes: true };
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: payload });
    await expect(getImportacao(17)).resolves.toEqual(payload);
    expect(get).toHaveBeenCalledWith("/carga-org-lot/importacoes/17/");
  });

  it("extrai integralmente o relatório estruturado e ignora erros genéricos", () => {
    const report = { codigo: "planilha_invalida", mensagem: "Arquivo rejeitado", leitura_completa: true, total_abas_lidas: 2, total_linhas_lidas: 303, total_erros: 2, erros: [{ codigo: "duplicado", mensagem: "Duplicado", aba: "Org", linha: 15, campo: "sigla" }] };
    const structured = new axios.AxiosError("bad", "ERR_BAD_REQUEST", undefined, undefined, { data: { errors: { arquivo: report } }, status: 400 } as never);
    expect(getValidationReport(structured)).toEqual(report);
    expect(getValidationReport(new Error("falha"))).toBeNull();
  });

  it("consulta o relatório persistente de uma importação", async () => {
    const payload = { idrelatoriovalidacao: 3, ocorrencias: [] };
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: payload });
    await expect(getRelatorioImportacao(17)).resolves.toEqual(payload);
    expect(get).toHaveBeenCalledWith("/carga-org-lot/importacoes/17/relatorio/");
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

  it("monta a rota do relatório XLSX de pendências da importação", () => {
    expect(pendenciasImportacaoDownloadUrl(17)).toBe(
      "/carga-org-lot/importacoes/17/pendencias/download/",
    );
  });
});
