import { afterEach, describe, expect, it, vi } from "vitest";

import {
  alterarIndicadoresMunicipaisEdocs,
  alterarIndicadorSemUsoEdocs,
  alterarSelecaoColetaEdocs,
  alterarSituacaoMunicipioEdocs,
  cadastrarMunicipioEdocs,
  corrigirCadastroMunicipioEdocs,
  decidirDivergenciaEdocs,
  listAuditoriaEdocs,
  listColetasEdocs,
  listDivergenciasEdocs,
  listPatriarcasEdocs,
  listImplantacoesEdocs,
  listMunicipiosIbge,
  listMunicipiosEdocs,
  listAuditoriaMunicipiosEdocs,
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
    await listImplantacoesEdocs({ ...common, ano: 2024, mes: 6, search: "SEGER" });
    await listMunicipiosIbge();
    await listMunicipiosEdocs({ ...common, search: "3201100" });
    await listAuditoriaMunicipiosEdocs({ ...common, municipio_id: 25 });

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
    expect(get).toHaveBeenNthCalledWith(5, "/pub-institucional/implantacoes-edocs/", {
      params: { ...common, ano: 2024, mes: 6, search: "SEGER" },
    });
    expect(get).toHaveBeenNthCalledWith(6, "/pub-institucional/ibge/municipios/");
    expect(get).toHaveBeenNthCalledWith(7, "/pub-institucional/municipios-edocs/", {
      params: { ...common, search: "3201100" },
    });
    expect(get).toHaveBeenNthCalledWith(8, "/pub-institucional/auditoria-municipios-edocs/", {
      params: { ...common, municipio_id: 25 },
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
    await alterarIndicadorSemUsoEdocs(7, {
      municipio_implantado_sem_uso_edocs: true,
      ano_inicio: 2024,
      mes_inicio: 6,
      justificativa: "Implantação confirmada sem uso.",
    });
    await solicitarColetaEdocs();
    await decidirDivergenciaEdocs(9, decision);
    const municipality = { codigo_ibge: 3201100, nome: "Bom Jesus do Norte", situacao: "SEM_DADOS" as const, ano_inicio: 2024, mes_inicio: 1, justificativa: "Cadastro inicial." };
    await cadastrarMunicipioEdocs(municipality);
    await alterarSituacaoMunicipioEdocs(25, { situacao: "MANIFESTOU_INTERESSE", ano_inicio: 2024, mes_inicio: 2, versao: 1, justificativa: "Interesse formalizado." });
    await corrigirCadastroMunicipioEdocs(25, { codigo_ibge: 3201100, nome: "Bom Jesus do Norte", versao: 2, justificativa: "Correção nominal." });

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
    expect(patch).toHaveBeenNthCalledWith(
      3,
      "/pub-institucional/patriarcas/7/indicador-municipio-sem-edocs/",
      {
        municipio_implantado_sem_uso_edocs: true,
        ano_inicio: 2024,
        mes_inicio: 6,
        justificativa: "Implantação confirmada sem uso.",
      },
    );
    expect(post).toHaveBeenNthCalledWith(1, "/pub-institucional/coletas/");
    expect(post).toHaveBeenNthCalledWith(
      2,
      "/pub-institucional/divergencias/9/decidir/",
      decision,
    );
    expect(post).toHaveBeenNthCalledWith(3, "/pub-institucional/municipios-edocs/", municipality);
    expect(patch).toHaveBeenNthCalledWith(4, "/pub-institucional/municipios-edocs/25/situacao/", { situacao: "MANIFESTOU_INTERESSE", ano_inicio: 2024, mes_inicio: 2, versao: 1, justificativa: "Interesse formalizado." });
    expect(patch).toHaveBeenNthCalledWith(5, "/pub-institucional/municipios-edocs/25/cadastro/", { codigo_ibge: 3201100, nome: "Bom Jesus do Norte", versao: 2, justificativa: "Correção nominal." });
  });
});
