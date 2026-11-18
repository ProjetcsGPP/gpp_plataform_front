import axios from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import api from "@/lib/api";
import { addSecao, createPublicacao, createVisao, getConflict, getPreviaPublicacao, listHistorico, listPublicacoes, publicarPublicacao, recalcularPublicacao, reabrirPublicacao, removeSecao, revogarPublicacao, substituirPublicacao, updateVisao } from "../api";

describe("API administrativa de publicações", () => {
  afterEach(() => vi.restoreAllMocks());

  it("integra criação, seções, cálculo e prévia sem inventar coleta", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: { id: "pub-1" } });
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: { id: "pub-1" } });
    await createPublicacao({ titulo: "Janeiro", ano_referencia: 2024, mes_referencia: 1 });
    await addSecao("pub-1", { configuracao_visao_id: "view-1", titulo: "E-Docs", ordem: 1 });
    await removeSecao("pub-1", "section-1");
    await recalcularPublicacao("pub-1");
    await getPreviaPublicacao("pub-1");
    expect(post).toHaveBeenNthCalledWith(1, "/pub-institucional/publicacoes/", { titulo: "Janeiro", ano_referencia: 2024, mes_referencia: 1 });
    expect(post).toHaveBeenNthCalledWith(2, "/pub-institucional/publicacoes/pub-1/secoes/", { configuracao_visao_id: "view-1", titulo: "E-Docs", ordem: 1 });
    expect(post.mock.calls[1][1]).not.toHaveProperty("coleta_id");
    expect(post).toHaveBeenNthCalledWith(3, "/pub-institucional/publicacoes/pub-1/remover-secao/", { secao_id: "section-1" });
    expect(post).toHaveBeenNthCalledWith(4, "/pub-institucional/publicacoes/pub-1/recalcular/");
    expect(get).toHaveBeenCalledWith("/pub-institucional/publicacoes/pub-1/previa/", { headers: { "Cache-Control": "no-store" } });
  });

  it("envia versão de registro, justificativas e transições contratadas", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: {} });
    await publicarPublicacao("pub-1", "Conferida.", 3);
    await reabrirPublicacao("pub-1");
    await substituirPublicacao("pub-1");
    await revogarPublicacao("pub-1", "Revogação necessária.");
    expect(post).toHaveBeenNthCalledWith(1, "/pub-institucional/publicacoes/pub-1/publicar/", { justificativa: "Conferida.", versao_registro: 3 });
    expect(post).toHaveBeenNthCalledWith(2, "/pub-institucional/publicacoes/pub-1/reabrir/");
    expect(post).toHaveBeenNthCalledWith(3, "/pub-institucional/publicacoes/pub-1/substituir/");
    expect(post).toHaveBeenNthCalledWith(4, "/pub-institucional/publicacoes/pub-1/revogar/", { justificativa: "Revogação necessária." });
  });

  it("preserva filtros, visões e histórico como contratos do backend", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: { results: [] } });
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: {} });
    const patch = vi.spyOn(api, "patch").mockResolvedValue({ data: {} });
    await listPublicacoes({ page: 2, page_size: 20, ano_referencia: 2024, mes_referencia: 1, situacao: "RASCUNHO", search: "janeiro", ordering: "-criado_em" });
    const view = { codigo: "MUNICIPIOS", nome: "Municípios", descricao: "", fonte: "EDOCS" as const, escopo: "PERSONALIZADO" as const, ativa: true, patriarcas_ids: [25] };
    await createVisao(view); await updateVisao("view-1", { patriarcas_ids: [25, 26] }); await listHistorico("pub-1");
    expect(get).toHaveBeenNthCalledWith(1, "/pub-institucional/publicacoes/", { params: expect.objectContaining({ ano_referencia: 2024, situacao: "RASCUNHO" }) });
    expect(post).toHaveBeenCalledWith("/pub-institucional/visoes-publicacao/", view);
    expect(patch).toHaveBeenCalledWith("/pub-institucional/visoes-publicacao/view-1/", { patriarcas_ids: [25, 26] });
    expect(get).toHaveBeenNthCalledWith(2, "/pub-institucional/historico-publicacoes/", { params: { publicacao_id: "pub-1", page_size: 100 } });
  });

  it("extrai o conflito 409 sem esconder o detalhe do backend", () => {
    const error = new axios.AxiosError("conflict", "409", undefined, undefined, { data: { codigo: "CONCORRENCIA_PUBLICACAO", detalhe: "Registro alterado." }, status: 409, statusText: "Conflict", headers: {}, config: { headers: new axios.AxiosHeaders() } });
    expect(getConflict(error)).toEqual({ codigo: "CONCORRENCIA_PUBLICACAO", detalhe: "Registro alterado." });
  });
});
