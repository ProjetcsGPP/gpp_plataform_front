import { SWRConfig } from "swr";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConjuntosLotacaoPage } from "@/features/carga-org-lot/ConjuntosLotacaoPage";
import { ConsultaLotacoesPage } from "@/features/carga-org-lot/ConsultaLotacoesPage";
import { PendenciasLotacaoPage } from "@/features/carga-org-lot/PendenciasLotacaoPage";
import * as cargaApi from "@/features/carga-org-lot/api";
import type { CasoValidacaoImportacao, ConjuntoLotacao, ImportacaoPlanilha } from "@/features/carga-org-lot/model";

vi.mock("next/navigation", () => ({ usePathname: () => "/carga-org-lot/lotacoes/conjuntos" }));
vi.mock("@/components/common/RouteGuard", () => ({ RouteGuard: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/hooks/usePermissions", () => ({ usePermissions: () => ({ can: () => true }) }));
vi.mock("@/features/carga-org-lot/usePatriarcaSelection", () => ({ usePatriarcaSelection: () => ({ selected: { idpatriarca: 1, strsiglapatriarca: "PMV", strnome: "Vitória" } }) }));
vi.mock("@/features/carga-org-lot/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/carga-org-lot/api")>();
  return { ...original, listConjuntosLotacao: vi.fn(), getResumoConjuntosLotacao: vi.fn(), getConjuntoLotacao: vi.fn(), listHistoricoConjuntoLotacao: vi.fn(), listImportacoes: vi.fn(), homologarConjuntoLotacao: vi.fn(), ativarConjuntoLotacao: vi.fn(), cancelarConjuntoLotacao: vi.fn(), listCasosValidacao: vi.fn(), getResumoPendencias: vi.fn(), listItensLotacao: vi.fn(), listItensLotacaoDescartados: vi.fn(), downloadArquivo: vi.fn() };
});

const set = {
  idconjuntolotacao: 31, idpatriarca_id: 1, idimportacaoorganograma_id: 7, idconjuntoanterior_id: null,
  strreferencia: "Outubro de 2026", strsituacao: "PRONTO_PARA_HOMOLOGACAO", situacao_nome: "Pronto para homologação", strjustificativaultimaacao: "", dathomologacao: null, datativacao: null, datcancelamento: null,
  total_importacoes: 2, total_registros: 25, total_casos_pendentes: 0, total_registros_descartados: 1, idconjuntosubstituto: null, download_consolidado_url: "/download/31/",
  patriarca_resumo: { idpatriarca: 1, sigla: "PMV", nome: "Vitória" },
  organograma_resumo: { idimportacaoplanilha: 7, referencia: "Estrutura 2026", nome_arquivo: "organograma.xlsx", status: "INCORPORADA", data_importacao: "2026-10-01T10:00:00Z" },
  acoes_disponiveis: { adicionar_planilha: { permitida: true, motivo: "" }, homologar: { permitida: true, motivo: "" }, ativar: { permitida: false, motivo: "Somente um conjunto homologado pode ser ativado." }, cancelar: { permitida: true, motivo: "" } },
  created_by_id: 1, created_by_name: "Teste", updated_by_id: 1, updated_by_name: "Teste", created_at: "2026-10-01T10:00:00Z", updated_at: "2026-10-22T10:00:00Z",
} satisfies ConjuntoLotacao;
const page = <T,>(results: T[]) => ({ count: results.length, next: null, previous: null, results });
const pendingImport = {
  idimportacaoplanilha: 21,
  strreferencia: "Lotação outubro",
  strnomearquivo: "lotacoes.xlsx",
  datimportacao: "2026-10-22T10:00:00Z",
  total_casos_pendentes: 2,
} as ImportacaoPlanilha;
function renderPage(node: React.ReactNode) { return render(<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{node}</SWRConfig>); }
function enablePendingImport() {
  vi.mocked(cargaApi.listImportacoes).mockImplementation(
    async (_patriarca, tipo) => tipo === 4 ? page([pendingImport]) : page([]),
  );
}

describe("operações de lotação", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cargaApi.listConjuntosLotacao).mockResolvedValue(page([set]));
    vi.mocked(cargaApi.getResumoConjuntosLotacao).mockResolvedValue({ total_conjuntos: 1, por_situacao: [{ situacao: "PRONTO_PARA_HOMOLOGACAO", nome: "Pronto para homologação", total: 1 }] });
    vi.mocked(cargaApi.getConjuntoLotacao).mockResolvedValue(set);
    vi.mocked(cargaApi.listHistoricoConjuntoLotacao).mockResolvedValue(page([]));
    vi.mocked(cargaApi.listImportacoes).mockResolvedValue(page([]));
    vi.mocked(cargaApi.homologarConjuntoLotacao).mockResolvedValue({ ...set, strsituacao: "HOMOLOGADO", situacao_nome: "Homologado" });
    vi.mocked(cargaApi.listCasosValidacao).mockResolvedValue(page([]));
    vi.mocked(cargaApi.getResumoPendencias).mockResolvedValue({ total: 0, por_assunto: [], por_severidade: [], por_status: [], por_patriarca: [], por_organograma: [], por_conjunto: [] });
    vi.mocked(cargaApi.listItensLotacao).mockResolvedValue(page([]));
    vi.mocked(cargaApi.listItensLotacaoDescartados).mockResolvedValue(page([]));
  });

  it("usa a situação e as ações disponíveis do backend para homologar", async () => {
    renderPage(<ConjuntosLotacaoPage />);
    await userEvent.click(await screen.findByRole("button", { name: "Detalhes" }));
    expect(screen.getByRole("button", { name: "Ativar" })).toBeDisabled();
    expect(screen.getByText("Somente um conjunto homologado pode ser ativado.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Homologar" }));
    await userEvent.type(screen.getByLabelText("Justificativa"), "Conteúdo conferido.");
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    await waitFor(() => expect(cargaApi.homologarConjuntoLotacao).toHaveBeenCalledWith(31, "Conteúdo conferido."));
  });

  it("resume por situação e filtra os conjuntos pelo organograma", async () => {
    vi.mocked(cargaApi.listImportacoes).mockResolvedValue(page([{
      idimportacaoplanilha: 7,
      strreferencia: "Estrutura 2026",
      strnomearquivo: "organograma.xlsx",
      status_importacao_nome: "Importada",
    } as never]));
    renderPage(<ConjuntosLotacaoPage />);
    expect((await screen.findAllByText("Pronto para homologação")).length).toBeGreaterThan(0);
    await userEvent.selectOptions(screen.getByLabelText("Organograma"), "7");
    await waitFor(() => expect(cargaApi.listConjuntosLotacao).toHaveBeenLastCalledWith(expect.objectContaining({ organograma: 7 })));
  });

  it("consulta a central de pendências com o patriarca e status pendente", async () => {
    enablePendingImport();
    renderPage(<PendenciasLotacaoPage />);
    await userEvent.selectOptions(await screen.findByLabelText("Planilha de lotação com pendências"), "21");
    await screen.findByText("Nenhuma pendência encontrada para os filtros selecionados.");
    expect(cargaApi.listCasosValidacao).toHaveBeenCalledWith(expect.objectContaining({ patriarca: 1, importacao: 21, status: "PENDENTE" }));
    expect(cargaApi.getResumoPendencias).toHaveBeenCalledWith({ patriarca: 1, importacao: 21, status: "PENDENTE" });
  });

  it("não repete organogramas ou conjuntos duplicados no resumo de pendências", async () => {
    enablePendingImport();
    vi.mocked(cargaApi.getResumoPendencias).mockResolvedValue({
      total: 2,
      por_assunto: [],
      por_severidade: [],
      por_status: [],
      por_patriarca: [],
      por_organograma: [
        { idimportacaoorganograma: 6, referencia: "Estrutura vigente", total: 1 },
        { idimportacaoorganograma: 6, referencia: "Estrutura vigente", total: 1 },
      ],
      por_conjunto: [
        { idconjuntolotacao: 6, referencia: "Lotação outubro", total: 1 },
        { idconjuntolotacao: 6, referencia: "Lotação outubro", total: 1 },
      ],
    });

    renderPage(<PendenciasLotacaoPage />);

    await userEvent.selectOptions(await screen.findByLabelText("Planilha de lotação com pendências"), "21");
    await screen.findByText("Nenhuma pendência encontrada para os filtros selecionados.");
    expect(screen.getAllByRole("option", { name: "Estrutura vigente" })).toHaveLength(1);
    expect(screen.getAllByRole("option", { name: "Lotação outubro" })).toHaveLength(1);
  });

  it("baixa o relatório da importação pela Central de pendências", async () => {
    enablePendingImport();
    const validationCase = {
      idcasovalidacao: 6,
      idrelatoriovalidacao_id: 2,
      strchaveagrupamento: "cpf-invalido",
      strcodigo: "cpf_invalido",
      strseveridade: "ERRO",
      severidade_nome: "Erro",
      strtitulo: "CPF inválido",
      strmensagem: "Revise o CPF informado.",
      strstatus: "PENDENTE",
      status_nome: "Pendente",
      datresolucao: null,
      assunto: "CPF",
      assunto_nome: "CPF",
      item_ids: [11],
      ocorrencia_ids: [12],
      alternativas: [],
      resolucoes: [],
      contexto: {
        importacao: { id: 21, referencia: "Outubro", nome_arquivo: "lotacoes.xlsx" },
        patriarca: { id: 1, sigla: "PMV", nome: "Vitória" },
        organograma: { id: 7, referencia: "Estrutura 2026", nome_arquivo: "organograma.xlsx" },
        conjunto: { id: 31, referencia: "Outubro de 2026", situacao: "COM_PENDENCIAS" },
      },
    } satisfies CasoValidacaoImportacao;
    vi.mocked(cargaApi.listCasosValidacao).mockResolvedValue(page([validationCase]));

    renderPage(<PendenciasLotacaoPage />);

    await userEvent.selectOptions(await screen.findByLabelText("Planilha de lotação com pendências"), "21");
    await userEvent.click(await screen.findByRole("button", { name: "Baixar pendências XLSX" }));
    expect(cargaApi.downloadArquivo).toHaveBeenCalledWith(
      "/carga-org-lot/importacoes/21/pendencias/download/",
      "pendencias-importacao-21.xlsx",
    );
  });

  it("consulta somente as lotações vigentes do patriarca", async () => {
    renderPage(<ConsultaLotacoesPage mode="VIGENTES" />);
    await screen.findByText("Nenhum registro encontrado para os filtros selecionados.");
    expect(cargaApi.listItensLotacao).toHaveBeenCalledWith(expect.objectContaining({ patriarca: 1, vigente: true }));
  });

  it("usa o endpoint agregado para registros descartados", async () => {
    renderPage(<ConsultaLotacoesPage mode="DESCARTADOS" />);
    await screen.findByText("Nenhum registro encontrado para os filtros selecionados.");
    expect(cargaApi.listItensLotacaoDescartados).toHaveBeenCalledWith(expect.objectContaining({ patriarca: 1 }));
  });
});
