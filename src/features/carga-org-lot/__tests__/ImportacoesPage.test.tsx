import { SWRConfig } from "swr";
import axios from "axios";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ImportacoesPage } from "@/features/carga-org-lot/ImportacoesPage";
import * as cargaApi from "@/features/carga-org-lot/api";
import type { ImportacaoPlanilha, RelatorioValidacaoImportacao } from "@/features/carga-org-lot/model";

vi.mock("@/components/common/RouteGuard", () => ({ RouteGuard: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/hooks/usePermissions", () => ({ usePermissions: () => ({ can: () => true }) }));
vi.mock("@/features/carga-org-lot/usePatriarcaSelection", () => ({
  usePatriarcaSelection: () => ({
    selected: { idpatriarca: 1, strsiglapatriarca: "PMBG", strnome: "Prefeitura" },
  }),
}));
vi.mock("@/features/carga-org-lot/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/carga-org-lot/api")>();
  return { ...original, listImportacoes: vi.fn(), listItensOrganograma: vi.fn(), listItensLotacaoImportados: vi.fn(), uploadImportacao: vi.fn(), createInitialOrganograma: vi.fn(), downloadArquivo: vi.fn(), deleteImportacao: vi.fn(), getImportacao: vi.fn(), getRelatorioImportacao: vi.fn(), getValidationReport: vi.fn(), getSheetSelectionReport: vi.fn(), resolveCasoValidacao: vi.fn(), incorporarLotacao: vi.fn() };
});

const empty = { count: 0, next: null, previous: null, results: [] };
const validationReport: RelatorioValidacaoImportacao = {
  idrelatoriovalidacao: 10,
  strresultado: "VALIDO",
  resultado_nome: "Válido",
  flgleituracompleta: true,
  inttotalabas: 1,
  inttotallinhas: 2,
  inttotalvalidas: 2,
  inttotalerros: 0,
  inttotalavisos: 0,
  inttotalnormalizacoes: 0,
  strversaoregras: "organograma-v1",
  jsonresumo: {},
  datprocessamento: "2026-10-01T12:00:00Z",
  ocorrencias: [],
};
const organograma: ImportacaoPlanilha = {
  idimportacaoplanilha: 7,
  idpatriarca_id: 1,
  patriarca: {} as never,
  idtipocarga_id: 3,
  tipo_carga: { idtipocarga: 3, strdescricao: "Organograma" },
  processo: null,
  idimportacaoorganograma_id: null,
  idstatusprogresso_id: 1,
  status: null,
  strnomearquivo: "organograma.xlsx",
  strtipomime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  inttamanhoarquivo: 100,
  strhasharquivo: "hash",
  strabaimportada: "Organograma",
  strreferencia: "Estrutura 2026",
  strstatusimportacao: "INCORPORADA",
  status_importacao_nome: "Incorporada",
  flgcriarunidadesespelho: false,
  flgpossuialteracoes: false,
  datprimeiraalteracao: null,
  datultimaalteracao: null,
  organograma_atualizado_download_url: null,
  datimportacao: "2026-10-01T12:00:00Z",
  download_url: "/download/7/",
  total_itens_organograma: 2,
  relatorio_validacao: validationReport,
  created_by_id: 5,
  created_by_name: "Usuário teste",
};
const organogramas = { count: 1, next: null, previous: null, results: [organograma] };
const lotacaoDoConjunto: ImportacaoPlanilha = {
  ...organograma,
  idimportacaoplanilha: 21,
  idtipocarga_id: 4,
  tipo_carga: { idtipocarga: 4, strdescricao: "Lotação" },
  idimportacaoorganograma_id: 7,
  idconjuntolotacao_id: 31,
  strtipooperacaolotacao: "ACRESCIMO",
  strnomearquivo: "lotacoes.xlsx",
  strreferencia: "Complemento de outubro",
  total_itens_organograma: 0,
  total_itens_lotacao: 25,
};

function setup(tipoCarga: 3 | 4) {
  return render(<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}><ImportacoesPage tipoCarga={tipoCarga} /></SWRConfig>);
}

function importacoesPage(tipoCarga: 3 | 4) {
  return (
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <ImportacoesPage tipoCarga={tipoCarga} />
    </SWRConfig>
  );
}

describe("telas de importação", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cargaApi.listImportacoes).mockResolvedValue(empty);
    vi.mocked(cargaApi.listItensOrganograma).mockResolvedValue([]);
    vi.mocked(cargaApi.listItensLotacaoImportados).mockResolvedValue([]);
    vi.mocked(cargaApi.uploadImportacao).mockResolvedValue({} as never);
    vi.mocked(cargaApi.createInitialOrganograma).mockResolvedValue(organograma);
    vi.mocked(cargaApi.getValidationReport).mockReturnValue(null);
    vi.mocked(cargaApi.getSheetSelectionReport).mockReturnValue(null);
    vi.mocked(cargaApi.getRelatorioImportacao).mockResolvedValue(validationReport);
    vi.mocked(cargaApi.getImportacao).mockImplementation(async (id) =>
      id === lotacaoDoConjunto.idimportacaoplanilha
        ? lotacaoDoConjunto
        : organograma,
    );
    vi.mocked(cargaApi.deleteImportacao).mockResolvedValue(undefined);
    vi.mocked(cargaApi.incorporarLotacao).mockResolvedValue({
      ...lotacaoDoConjunto,
      strstatusimportacao: "INCORPORADA",
    });
  });

  it("mostra loading e estado vazio depois da seleção do patriarca", async () => {
    let resolveList!: (value: typeof empty) => void;
    vi.mocked(cargaApi.listImportacoes).mockReturnValue(new Promise((resolve) => { resolveList = resolve; }));
    setup(3);
    expect(screen.getByText("Carregando arquivos...")).toBeInTheDocument();
    resolveList(empty);
    expect(await screen.findByText("Nenhum arquivo enviado para este patriarca.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Baixar versão mais recente" })).not.toBeInTheDocument();
  });

  it("cria um organograma inicial em card separado e abre a visualização", async () => {
    setup(3);

    const createHeading = await screen.findByRole("heading", {
      name: "Criar organograma do zero",
    });
    const sendHeading = screen.getByRole("heading", { name: "Enviar organograma" });
    const createCard = createHeading.closest("section");
    const sendCard = sendHeading.closest("section");
    expect(createCard?.parentElement).toBe(sendCard?.parentElement);
    expect(createCard?.parentElement).toHaveClass("lg:grid-cols-2");
    expect(sendHeading.parentElement?.previousElementSibling).toHaveClass(
      "size-10",
      "bg-sky-100",
    );
    expect(within(sendCard!).getByText("Importação de planilha existente")).toBeInTheDocument();
    expect(within(sendCard!).getByText(/Envie uma estrutura existente para validar/i)).toHaveClass(
      "mt-1",
      "text-sm",
      "text-slate-600",
    );
    expect(within(sendCard!).queryByText(/PMBG - Prefeitura/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Gabinete do Prefeito e as Secretarias Municipais da Fazenda/i)).toBeInTheDocument();
    expect(screen.getByText(/alterar os nomes e as siglas a qualquer momento/i)).toBeInTheDocument();

    expect(within(sendCard!).getByLabelText(/Referência/).closest("label")).toHaveClass("flex-1");
    expect(within(sendCard!).getByLabelText("Arquivo").closest("label")).toHaveClass("flex-1");
    const mirrorOption = within(sendCard!).getByRole("checkbox", {
      name: "Criar automaticamente uma unidade para cada órgão",
    });
    const sendFile = within(sendCard!).getByRole("button", {
      name: "Enviar arquivo",
    });
    expect(mirrorOption.closest("label")?.parentElement).toBe(sendFile.parentElement);

    const reference = within(createCard!).getByLabelText(
      /Referência \(opcional\)/i,
    );
    expect(reference).toHaveValue("Estrutura inicial padrão");
    await userEvent.clear(reference);
    await userEvent.type(reference, " Modelo 2026 ");
    await userEvent.click(screen.getByRole("button", { name: "Criar organograma inicial" }));

    await waitFor(() => expect(cargaApi.createInitialOrganograma).toHaveBeenCalledWith(1, " Modelo 2026 "));
    expect(await screen.findByRole("region", { name: "Organograma lido" })).toBeInTheDocument();
    expect(cargaApi.listImportacoes).toHaveBeenCalledTimes(2);
  });

  it("não oferece criação do zero na página de lotações", async () => {
    vi.mocked(cargaApi.listImportacoes).mockImplementation(async () => empty);
    setup(4);
    expect(screen.queryByRole("heading", { name: "Criar organograma do zero" })).not.toBeInTheDocument();
  });

  it("mostra o download mais recente somente quando existe organograma", async () => {
    vi.mocked(cargaApi.listImportacoes).mockResolvedValue(organogramas);
    setup(3);
    const storedFiles = (await screen.findByRole("heading", { name: "Arquivos armazenados" })).closest("section");
    expect(within(storedFiles!).getByRole("button", { name: "Baixar versão mais recente" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Visualizar organograma" }));
    expect(await screen.findByRole("region", { name: "Organograma lido" })).toBeInTheDocument();
    expect(screen.queryByText("Arquivos armazenados")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Voltar à lista de arquivos" }));
    expect(await screen.findByText("Arquivos armazenados")).toBeInTheDocument();
    expect(cargaApi.listItensOrganograma).toHaveBeenCalledWith(7);
  });

  it("leva a importação de lotações para uma tela exclusiva", async () => {
    vi.mocked(cargaApi.listImportacoes).mockResolvedValue(empty);
    setup(4);
    const action = screen.getByRole("link", { name: "Nova importação" });
    expect(action).toHaveAttribute("href", "/carga-org-lot/lotacoes/importar");
    expect(screen.queryByRole("heading", { name: "Enviar arquivo de lotação" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Versão do organograma")).not.toBeInTheDocument();
    expect(cargaApi.uploadImportacao).not.toHaveBeenCalled();
  });

  it("prioriza o organograma e explica a preservação histórica nos detalhes", async () => {
    vi.mocked(cargaApi.listImportacoes).mockImplementation(
      async (_patriarca, tipo) =>
        tipo === 3
          ? organogramas
          : tipo === 4
          ? { count: 1, next: null, previous: null, results: [lotacaoDoConjunto] }
          : empty,
    );
    setup(4);

    expect(await screen.findByText("Estrutura 2026")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Organograma" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Tipo / aba" })).not.toBeInTheDocument();
    expect(screen.queryByText("Histórico protegido")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Excluir" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Detalhes" }));
    const dialog = screen.getByRole("dialog", { name: "Detalhes da importação" });
    expect(within(dialog).getByText("Aba processada")).toBeInTheDocument();
    expect(within(dialog).getByText("Acréscimo")).toBeInTheDocument();
    expect(within(dialog).getByText(/histórico auditável do conjunto/i)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "Fechar" }));

    await userEvent.click(screen.getByRole("button", { name: "Relatório" }));
    expect(await screen.findByText("Organograma: Estrutura 2026")).toBeInTheDocument();
  });

  it("oferece a incorporação quando as críticas inválidas já foram tratadas", async () => {
    const invalidReport = {
      ...validationReport,
      strresultado: "INVALIDO" as const,
      resultado_nome: "Inválido",
      inttotalerros: 1,
      casos: [],
    };
    const readyImport = {
      ...lotacaoDoConjunto,
      strstatusimportacao: "PRONTA_PARA_INCORPORAR" as const,
      status_importacao_nome: "Pronta para incorporar",
      total_casos_pendentes: 0,
      relatorio_validacao: invalidReport,
    };
    vi.mocked(cargaApi.listImportacoes).mockImplementation(
      async (_patriarca, tipo) =>
        tipo === 3
          ? organogramas
          : tipo === 4
            ? { count: 1, next: null, previous: null, results: [readyImport] }
            : empty,
    );
    vi.mocked(cargaApi.getImportacao).mockResolvedValue(readyImport);
    vi.mocked(cargaApi.getRelatorioImportacao).mockResolvedValue(invalidReport);

    setup(4);

    expect(await screen.findByText("Críticas tratadas")).toBeInTheDocument();
    expect(screen.getByText("Resultado original: Inválido")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Incorporar" }));

    expect(await screen.findByRole("button", { name: "Revisão e incorporação (0)" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Incorporar lotações" }));
    await userEvent.click(screen.getByRole("button", { name: "Confirmar incorporação" }));

    await waitFor(() => expect(cargaApi.incorporarLotacao).toHaveBeenCalledWith(21));
  });

  it("filtra as lotações por organograma e aplica a ordenação no backend", async () => {
    vi.mocked(cargaApi.listImportacoes).mockImplementation(
      async (_patriarca, tipo) => (tipo === 3 ? organogramas : empty),
    );
    setup(4);

    const organogramFilter = await screen.findByLabelText("Organograma");
    await userEvent.selectOptions(organogramFilter, "7");
    await userEvent.selectOptions(screen.getByLabelText("Ordenar por"), "strnomearquivo");

    await waitFor(() =>
      expect(cargaApi.listImportacoes).toHaveBeenCalledWith(
        1,
        4,
        expect.objectContaining({ organograma: 7, ordering: "strnomearquivo" }),
      ),
    );
  });

  it("preserva o arquivo no 409 e reenvia com a aba escolhida", async () => {
    const selection = { codigo: "selecao_aba_obrigatoria" as const, mensagem: "Selecione a aba.", abas: [{ nome: "Organograma", ordem: 1, linhas_preenchidas: 177 }, { nome: "Observações", ordem: 2, linhas_preenchidas: 12 }] };
    vi.mocked(cargaApi.uploadImportacao).mockRejectedValueOnce(new Error("409")).mockResolvedValueOnce({} as never);
    vi.mocked(cargaApi.getSheetSelectionReport).mockReturnValueOnce(selection).mockReturnValue(null);
    setup(3);
    await userEvent.click(
      screen.getByRole("checkbox", {
        name: "Criar automaticamente uma unidade para cada órgão",
      }),
    );
    const file = new File(["dados"], "organograma.xlsx");
    await userEvent.upload(screen.getByLabelText("Arquivo"), file);
    await userEvent.click(screen.getByRole("button", { name: "Enviar arquivo" }));
    expect(await screen.findByRole("dialog", { name: "Selecione a aba do organograma" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: /Observações/ }));
    await userEvent.click(screen.getByRole("button", { name: "Importar aba selecionada" }));
    await waitFor(() => expect(cargaApi.uploadImportacao).toHaveBeenLastCalledWith(1, 3, file, expect.objectContaining({ aba: "Observações", criarUnidadesEspelho: true })));
    expect(cargaApi.uploadImportacao).toHaveBeenCalledTimes(2);
  });

  it("cancela a seleção de aba sem descartar o arquivo", async () => {
    vi.mocked(cargaApi.uploadImportacao).mockRejectedValueOnce(new Error("409"));
    vi.mocked(cargaApi.getSheetSelectionReport).mockReturnValueOnce({ codigo: "selecao_aba_obrigatoria", mensagem: "Selecione.", abas: [{ nome: "Org", ordem: 1, linhas_preenchidas: 2 }] });
    setup(3);
    const file = new File(["dados"], "organograma.xlsx");
    await userEvent.upload(screen.getByLabelText("Arquivo"), file);
    await userEvent.click(screen.getByRole("button", { name: "Enviar arquivo" }));
    await userEvent.click(await screen.findByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText(/Selecionado: organograma.xlsx/)).toBeInTheDocument();
  });

  it("confirma e exclui definitivamente uma importação", async () => {
    vi.mocked(cargaApi.listImportacoes).mockResolvedValue(organogramas);
    setup(3);
    await userEvent.click(await screen.findByRole("button", { name: "Excluir" }));
    expect(screen.getByText(/não pode ser desfeita/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Excluir definitivamente" }));
    await waitFor(() => expect(cargaApi.deleteImportacao).toHaveBeenCalledWith(7));
  });

  it("mantém a lista e exibe a mensagem quando a exclusão está bloqueada", async () => {
    vi.mocked(cargaApi.listImportacoes).mockResolvedValue(organogramas);
    vi.mocked(cargaApi.deleteImportacao).mockRejectedValue(new axios.AxiosError("bad", "ERR_BAD_REQUEST", undefined, undefined, { status: 400, data: { errors: ["O registro não pode ser excluído porque está em uso."] } } as never));
    setup(3);
    await userEvent.click(await screen.findByRole("button", { name: "Excluir" }));
    await userEvent.click(screen.getByRole("button", { name: "Excluir definitivamente" }));
    expect(await screen.findByText("O registro não pode ser excluído porque está em uso.")).toBeInTheDocument();
    expect(screen.getByText("Estrutura 2026")).toBeInTheDocument();
  });

  it("abre o relatório estruturado quando o backend rejeita o organograma", async () => {
    const validation = { idimportacaoplanilha: 123, codigo: "planilha_invalida", mensagem: "Planilha com erros", leitura_completa: false, total_abas_lidas: 0, total_linhas_lidas: 0, total_erros: 1, erros: [{ codigo: "arquivo_ilegivel", mensagem: "Falha ao abrir" }] };
    vi.mocked(cargaApi.uploadImportacao).mockRejectedValue(new Error("400"));
    vi.mocked(cargaApi.getValidationReport).mockReturnValue(validation);
    setup(3);
    fireEvent.change(screen.getByLabelText("Arquivo"), { target: { files: [new File(["x"], "org.xlsx")] } });
    await userEvent.click(screen.getByRole("button", { name: "Enviar arquivo" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/registrada como importação #123/i)).toBeInTheDocument();
    expect(screen.getByText("arquivo_ilegivel")).toBeInTheDocument();
    expect(screen.getByText(/não pôde ser aberto ou interpretado/i)).toBeInTheDocument();
  });

  it("mostra o relatório persistente e não oferece organograma para importação rejeitada", async () => {
    const rejected = {
      ...organograma,
      idimportacaoplanilha: 8,
      strstatusimportacao: "REJEITADA" as const,
      status_importacao_nome: "Rejeitada",
      total_itens_organograma: 0,
      relatorio_validacao: { ...validationReport, strresultado: "INVALIDO" as const, resultado_nome: "Inválido", inttotalerros: 1 },
    };
    vi.mocked(cargaApi.listImportacoes).mockResolvedValue({ ...organogramas, results: [rejected] });
    vi.mocked(cargaApi.getRelatorioImportacao).mockResolvedValue(rejected.relatorio_validacao);
    setup(3);
    expect(await screen.findByText("Rejeitada")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Visualizar organograma" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Baixar versão mais recente" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Relatório" }));
    expect(await screen.findByRole("region", { name: "Relatório de validação" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Maximizar críticas" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Recolher filtros" })).toBeInTheDocument();
    expect(cargaApi.getRelatorioImportacao).toHaveBeenCalledWith(8);
  });

  it("fecha a visualização transitória ao alternar entre lotações e organogramas", async () => {
    vi.mocked(cargaApi.listImportacoes).mockImplementation(
      async (_patriarca, tipo) =>
        tipo === 3
          ? organogramas
          : tipo === 4
            ? { count: 1, next: null, previous: null, results: [lotacaoDoConjunto] }
            : empty,
    );
    const view = render(importacoesPage(4));

    await userEvent.click(await screen.findByRole("button", { name: "Relatório" }));
    expect(screen.getByRole("region", { name: "Relatório de validação" })).toBeInTheDocument();

    view.rerender(importacoesPage(3));

    expect(await screen.findByRole("heading", { name: "Organogramas" })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole("region", { name: "Relatório de validação" })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("heading", { name: "Arquivos armazenados" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Visualizar organograma" }));
    expect(await screen.findByRole("region", { name: "Organograma lido" })).toBeInTheDocument();

    view.rerender(importacoesPage(4));

    expect(await screen.findByRole("heading", { name: "Lotações" })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole("region", { name: "Organograma lido" })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("heading", { name: "Arquivos armazenados" })).toBeInTheDocument();
  });

  it("exibe falha da API e permite tentar novamente", async () => {
    vi.mocked(cargaApi.listImportacoes).mockRejectedValue(new Error("offline"));
    setup(3);
    expect(await screen.findByText("Não foi possível carregar os arquivos.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
  });
});
