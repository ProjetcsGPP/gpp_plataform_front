import { SWRConfig } from "swr";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LotacaoReviewWorkspace } from "@/features/carga-org-lot/LotacaoReviewWorkspace";
import * as cargaApi from "@/features/carga-org-lot/api";
import type { CasoValidacaoImportacao, ImportacaoPlanilha, ItemLotacaoImportado, ItemOrganograma, RelatorioValidacaoImportacao } from "@/features/carga-org-lot/model";

vi.mock("@/hooks/usePermissions", () => ({ usePermissions: () => ({ can: () => true }) }));
vi.mock("@/features/carga-org-lot/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/carga-org-lot/api")>();
  return { ...original, listItensLotacaoImportados: vi.fn(), listItensOrganograma: vi.fn(), resolveCasoValidacao: vi.fn(), incorporarLotacao: vi.fn() };
});

const importedItem: ItemLotacaoImportado = {
  iditemlotacaoimportado: 123,
  idimportacaoplanilha_id: 21,
  idorgaoorganograma_id: 2,
  idunidadeorganograma_id: 3,
  strsiglaorgaooriginal: "SEMUS",
  strsiglaorgao: "SEMUS",
  strnomeorgao: "Secretaria de Saúde",
  strnomeservidor: "MARIA SILVA",
  strcpforiginal: "903.961.004-57",
  strcpf: "90396100457",
  strcargooriginal: "Auxiliar",
  strcargonormalizado: "AUXILIAR",
  strsiglaunidadeoriginal: "RH",
  strsiglaunidade: "RH",
  strnomeunidade: "Recursos Humanos",
  strabaorigem: "Servidores",
  intlinhaorigem: 12,
  strsituacao: "COM_ERROS",
  situacao_nome: "Com erros",
};
const errorCase: CasoValidacaoImportacao = {
  idcasovalidacao: 9,
  idrelatoriovalidacao_id: 10,
  strchaveagrupamento: "nome:123",
  strcodigo: "nome_servidor_ausente",
  strseveridade: "ERRO",
  severidade_nome: "Erro",
  strtitulo: "Nome do servidor ausente",
  strmensagem: "Informe o nome do servidor.",
  strstatus: "PENDENTE",
  status_nome: "Pendente",
  datresolucao: null,
  item_ids: [123],
  ocorrencia_ids: [1],
  alternativas: [],
  resolucoes: [],
};
const warningCase: CasoValidacaoImportacao = {
  ...errorCase,
  idcasovalidacao: 10,
  strchaveagrupamento: "cpf:90396100457",
  strcodigo: "cpf_duplicado_planilha",
  strseveridade: "AVISO",
  severidade_nome: "Aviso",
  strtitulo: "CPF repetido",
  strmensagem: "O CPF aparece em mais de uma lotação.",
};
const importacao = {
  idimportacaoplanilha: 21,
  idpatriarca_id: 1,
  idtipocarga_id: 4,
  idimportacaoorganograma_id: 7,
  strstatusimportacao: "AGUARDANDO_REVISAO",
} as ImportacaoPlanilha;
const report = {
  casos: [errorCase, warningCase],
  ocorrencias: [],
} as unknown as RelatorioValidacaoImportacao;
const organogramItems: ItemOrganograma[] = [
  { iditemorganograma: 1, idimportacaoplanilha_id: 7, idpai_id: null, pai_sigla: null, strnome: "Prefeitura", strsigla: "PM", strnumero: "1", strresponsavel: "", strcargo: "", flggeradoautomaticamente: false, strabaorigem: "Org", intlinhaorigem: 1, strreferenciapai: "" },
  { iditemorganograma: 2, idimportacaoplanilha_id: 7, idpai_id: 1, pai_sigla: "PM", strnome: "Secretaria de Saúde", strsigla: "SEMUS", strnumero: "1.1", strresponsavel: "", strcargo: "", flggeradoautomaticamente: false, strabaorigem: "Org", intlinhaorigem: 2, strreferenciapai: "PM" },
  { iditemorganograma: 3, idimportacaoplanilha_id: 7, idpai_id: 2, pai_sigla: "SEMUS", strnome: "Recursos Humanos", strsigla: "RH", strnumero: "1.1.1", strresponsavel: "", strcargo: "", flggeradoautomaticamente: false, strabaorigem: "Org", intlinhaorigem: 3, strreferenciapai: "SEMUS" },
  { iditemorganograma: 4, idimportacaoplanilha_id: 7, idpai_id: 2, pai_sigla: "SEMUS", strnome: "Setor de Recursos Humanos", strsigla: "rh", strnumero: "1.1.2", strresponsavel: "", strcargo: "", flggeradoautomaticamente: false, strabaorigem: "Org", intlinhaorigem: 4, strreferenciapai: "SEMUS" },
];

function setup(
  currentImportacao = importacao,
  currentReport: RelatorioValidacaoImportacao = report,
) {
  const onRefresh = vi.fn().mockResolvedValue(undefined);
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <LotacaoReviewWorkspace importacao={currentImportacao} report={currentReport} onRefresh={onRefresh} />
    </SWRConfig>,
  );
  return onRefresh;
}

describe("revisão de casos de lotação", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cargaApi.listItensLotacaoImportados).mockResolvedValue([importedItem]);
    vi.mocked(cargaApi.listItensOrganograma).mockResolvedValue(organogramItems);
    vi.mocked(cargaApi.resolveCasoValidacao).mockResolvedValue({ ...errorCase, strstatus: "CORRIGIDO" });
    vi.mocked(cargaApi.incorporarLotacao).mockResolvedValue({ ...importacao, strstatusimportacao: "INCORPORADA" });
  });

  it("corrige manualmente somente os campos alterados e revalida os dados", async () => {
    const onRefresh = setup();
    await userEvent.click((await screen.findAllByRole("button", { name: "Resolver caso" }))[0]);
    expect(screen.queryByRole("button", { name: "Aceitar como informado" })).not.toBeInTheDocument();
    const unitOptions = within(screen.getByLabelText("Unidade do organograma"))
      .getAllByRole("option")
      .filter((option) => option.textContent?.replace(/[^a-z0-9]/gi, "").toUpperCase() === "RHRECURSOSHUMANOS");
    expect(unitOptions).toHaveLength(1);
    expect(screen.queryByRole("option", { name: /Setor de Recursos Humanos/ })).not.toBeInTheDocument();

    const name = screen.getByLabelText("Nome do servidor");
    expect(name.closest("label")).toHaveTextContent("Original da planilha");
    expect(name.closest("label")).toHaveTextContent("MARIA SILVA");
    await userEvent.clear(name);
    await userEvent.type(name, "MARIA DA SILVA");
    expect(name.closest("label")).toHaveTextContent("MARIA SILVA");
    await userEvent.click(screen.getByRole("button", { name: "Salvar correção e revalidar" }));

    await waitFor(() => expect(cargaApi.resolveCasoValidacao).toHaveBeenCalledWith(9, {
      acao: "CORRIGIR_MANUALMENTE",
      alteracoes: [{ iditemlotacaoimportado: 123, campos: { strnomeservidor: "MARIA DA SILVA" } }],
    }));
    expect(onRefresh).toHaveBeenCalled();
  });

  it("formata e valida o CPF, mas envia somente os 11 dígitos", async () => {
    setup();
    await userEvent.click((await screen.findAllByRole("button", { name: "Resolver caso" }))[0]);

    const cpf = screen.getByLabelText("CPF");
    await userEvent.clear(cpf);
    await userEvent.type(cpf, "52998224725");

    expect(cpf).toHaveValue("529.982.247-25");
    await userEvent.click(screen.getByRole("button", { name: "Salvar correção e revalidar" }));

    await waitFor(() => expect(cargaApi.resolveCasoValidacao).toHaveBeenCalledWith(9, {
      acao: "CORRIGIR_MANUALMENTE",
      alteracoes: [{ iditemlotacaoimportado: 123, campos: { strcpf: "52998224725" } }],
    }));
  });

  it("não permite enviar um CPF inválido", async () => {
    setup();
    await userEvent.click((await screen.findAllByRole("button", { name: "Resolver caso" }))[0]);

    const cpf = screen.getByLabelText("CPF");
    await userEvent.clear(cpf);
    await userEvent.type(cpf, "12345678901");

    expect(screen.getByText("Informe um CPF válido com 11 dígitos.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar correção e revalidar" })).toBeDisabled();
    expect(cargaApi.resolveCasoValidacao).not.toHaveBeenCalled();
  });

  it("permite aceitar um aviso somente com justificativa", async () => {
    setup();
    const resolveButtons = await screen.findAllByRole("button", { name: "Resolver caso" });
    await userEvent.click(resolveButtons[1]);
    await userEvent.click(screen.getByRole("button", { name: "Aceitar como informado" }));
    const confirm = screen.getByRole("button", { name: "Confirmar aceitação" });
    expect(confirm).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Justificativa"), "As duas lotações são válidas.");
    await userEvent.click(confirm);

    await waitFor(() => expect(cargaApi.resolveCasoValidacao).toHaveBeenCalledWith(10, {
      acao: "ACEITAR_COMO_INFORMADO",
      justificativa: "As duas lotações são válidas.",
    }));
  });

  it("exige justificativa e confirmação explícita para descartar linhas", async () => {
    setup();
    await userEvent.click((await screen.findAllByRole("button", { name: "Resolver caso" }))[0]);
    await userEvent.click(screen.getByRole("button", { name: "Descartar linhas" }));
    const discard = screen.getAllByRole("button", { name: "Descartar linhas" }).at(-1)!;
    expect(discard).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Justificativa"), "Registro inválido.");
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(discard);

    await waitFor(() => expect(cargaApi.resolveCasoValidacao).toHaveBeenCalledWith(9, {
      acao: "DESCARTAR_LINHAS",
      justificativa: "Registro inválido.",
    }));
  });

  it("incorpora somente após confirmação quando a importação está pronta", async () => {
    const onRefresh = setup({ ...importacao, strstatusimportacao: "PRONTA_PARA_INCORPORAR" });
    await userEvent.click(await screen.findByRole("button", { name: "Incorporar lotações" }));
    expect(screen.getByRole("dialog", { name: "Incorporar lotações" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Confirmar incorporação" }));

    await waitFor(() => expect(cargaApi.incorporarLotacao).toHaveBeenCalledWith(21));
    expect(onRefresh).toHaveBeenCalled();
  });

  it("mantém lado a lado os valores originais e corrigidos após o tratamento", async () => {
    const correctedItem = {
      ...importedItem,
      strnomeservidor: "MARIA DA SILVA",
      strsituacao: "INCORPORADO" as const,
      situacao_nome: "Incorporado",
    };
    const correctedCase = {
      ...errorCase,
      strstatus: "CORRIGIDO" as const,
      status_nome: "Corrigido",
      datresolucao: "2026-10-21T12:00:00Z",
      resolucoes: [{
        idresolucaovalidacao: 51,
        idalternativaresolucao_id: null,
        stracao: "CORRIGIR_MANUALMENTE" as const,
        strjustificativa: "Nome conferido.",
        jsonantes: [{ iditemlotacaoimportado: 123, strnomeservidor: "MARIA SILVA" }] as never,
        jsondepois: [{ iditemlotacaoimportado: 123, strnomeservidor: "MARIA DA SILVA" }] as never,
        datresolucao: "2026-10-21T12:00:00Z",
        created_by_name: "Usuário teste",
      }],
    };
    vi.mocked(cargaApi.listItensLotacaoImportados).mockResolvedValue([correctedItem]);
    setup(
      { ...importacao, strstatusimportacao: "INCORPORADA", total_casos_pendentes: 0 },
      { ...report, casos: [correctedCase] },
    );

    expect(await screen.findByText("Nome do servidor ausente")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Itens tratados (1)" }));
    expect(screen.getByText("MARIA SILVA")).toBeInTheDocument();
    expect(screen.getByText(/MARIA DA SILVA/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Decisões (1)" }));
    await userEvent.click(screen.getByRole("button", { name: "Ver decisão" }));
    expect(screen.getByText("Valores alterados")).toBeInTheDocument();
    expect(screen.getByText("Item #123 · Nome do servidor")).toBeInTheDocument();
  });
});
