import { SWRConfig } from "swr";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EnvioOrganogramaProdestPage } from "@/features/carga-org-lot/EnvioOrganogramaProdestPage";
import * as cargaApi from "@/features/carga-org-lot/api";
import type { EnvioOrganogramaProdest, ImportacaoPlanilha } from "@/features/carga-org-lot/model";

vi.mock("@/components/common/RouteGuard", () => ({
  RouteGuard: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/features/carga-org-lot/OrganogramaTreeDialog", () => ({
  OrganogramaTreePanel: ({ onClose }: { onClose: () => void }) => (
    <div><p>Prévia do organograma</p><button onClick={onClose}>Fechar prévia</button></div>
  ),
}));

let canChange = true;
let selectedPatriarch = {
  idpatriarca: 1,
  strsiglapatriarca: "PMBG",
  strnome: "Prefeitura Municipal",
};
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    can: (permission: string) => permission === "view_importacaoplanilha"
      || (permission === "change_importacaoplanilha" && canChange),
  }),
}));
vi.mock("@/features/carga-org-lot/usePatriarcaSelection", () => ({
  usePatriarcaSelection: () => ({ selected: selectedPatriarch }),
}));
vi.mock("@/features/carga-org-lot/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/carga-org-lot/api")>();
  return {
    ...original,
    listImportacoes: vi.fn(),
    listEnviosOrganogramaProdest: vi.fn(),
    getAcompanhamentoEnvioOrganograma: vi.fn(),
    listEventosEnvioOrganograma: vi.fn(),
    solicitarEnvioOrganogramaProdest: vi.fn(),
    consultarStatusEnvioOrganogramaProdest: vi.fn(),
    consultarRelatorioEnvioOrganogramaProdest: vi.fn(),
    getEnvioOrganogramaProdest: vi.fn(),
  };
});

const patriarch = {
  idpatriarca: 1,
  strsiglapatriarca: "PMBG",
  strnome: "Prefeitura Municipal",
};
const importOne = {
  idimportacaoplanilha: 10,
  idpatriarca_id: 1,
  patriarca: patriarch,
  strreferencia: "Estrutura vigente",
  strnomearquivo: "organograma-vigente.xlsx",
  datimportacao: "2026-10-18T12:00:00Z",
  strstatusimportacao: "INCORPORADA",
  status_importacao_nome: "Incorporada",
  flgpossuialteracoes: false,
  total_itens_organograma: 48,
  created_by_name: "Maria",
} as ImportacaoPlanilha;

function envio(overrides: Partial<EnvioOrganogramaProdest> = {}): EnvioOrganogramaProdest {
  return {
    idenvioorganograma: 15,
    idimportacaoplanilha_id: 10,
    idprocessocargainicial_id: 3,
    idpatriarca_id: 1,
    patriarca_nome: "Prefeitura Municipal",
    importacao_referencia: "Estrutura vigente",
    flgdryrun: true,
    modo: "SIMULACAO",
    strambiente: "HML",
    idexternocarga: "uuid-carga",
    strstatus: "PROCESSANDO",
    status_nome: "Processando",
    finalizada_prodest: false,
    relatorio_disponivel: false,
    etapas_prodest: [],
    strfaseatual: "PROCESSAMENTO",
    fase_atual: "PROCESSAMENTO",
    fase_atual_nome: "Processamento",
    status_atual: "EM_ANDAMENTO",
    status_atual_nome: "Em andamento",
    strmensagematual: "Carga em processamento na PRODEST.",
    mensagem_atual: "Carga em processamento na PRODEST.",
    datultimaatividade: "2026-10-19T10:01:00Z",
    datproximaconsulta: null,
    acoes_disponiveis: {
      consultar_detalhes: true,
      consultar_status: true,
      consultar_relatorio: false,
      tentar_novamente: false,
    },
    ultimo_evento_id: 1,
    strhashpayload: "hash",
    jsonstatusprodest: {},
    jsonrelatorioprodest: {},
    strmensagemerro: "",
    datsolicitacao: "2026-10-19T10:00:00Z",
    datultimaconsulta: null,
    datfinalizacao: null,
    created_by_id: 2,
    created_by_name: "Maria",
    updated_by_id: 2,
    updated_by_name: "Maria",
    created_at: "2026-10-19T10:00:00Z",
    updated_at: "2026-10-19T10:01:00Z",
    ...overrides,
  };
}

const emptyPage = { count: 0, next: null, previous: null, results: [] };

function renderPage() {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <EnvioOrganogramaProdestPage />
    </SWRConfig>,
  );
}

describe("envio assíncrono do organograma para a PRODEST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    canChange = true;
    selectedPatriarch = { ...patriarch };
    vi.mocked(cargaApi.listImportacoes).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [importOne],
    });
    vi.mocked(cargaApi.listEnviosOrganogramaProdest).mockResolvedValue(emptyPage);
    vi.mocked(cargaApi.getAcompanhamentoEnvioOrganograma).mockResolvedValue({
      patriarca_id: 1,
      tentativa_ativa: null,
      ultimo_resultado: null,
      bloqueio_novo_envio: false,
      motivo_bloqueio: "",
      eventos_recentes: [],
    });
    vi.mocked(cargaApi.listEventosEnvioOrganograma).mockResolvedValue({
      idenvioorganograma: 15,
      ultimo_evento_id: 0,
      possui_mais: false,
      eventos: [],
    });
    vi.mocked(cargaApi.solicitarEnvioOrganogramaProdest).mockResolvedValue(envio());
    vi.mocked(cargaApi.getEnvioOrganogramaProdest).mockResolvedValue(envio());
    vi.mocked(cargaApi.consultarStatusEnvioOrganogramaProdest).mockResolvedValue(envio());
    vi.mocked(cargaApi.consultarRelatorioEnvioOrganogramaProdest).mockResolvedValue(envio());
  });

  it("guia seleção, modalidade e confirmação antes da simulação", async () => {
    renderPage();
    await userEvent.click(await screen.findByRole("radio", { name: /Selecionar Estrutura vigente/i }));
    await userEvent.click(screen.getByRole("button", { name: /Continuar/i }));
    expect(screen.getByText("Como deseja realizar o envio?")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Continuar/i }));
    expect(screen.getByText("Confira antes de iniciar")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Iniciar simulação" }));
    await waitFor(() => expect(cargaApi.solicitarEnvioOrganogramaProdest).toHaveBeenCalledWith(10, true));
    expect(await screen.findByText(/Simulação iniciada/i)).toBeInTheDocument();
  });

  it("impede envio duplicado enquanto a solicitação está pendente", async () => {
    let resolveRequest!: (value: EnvioOrganogramaProdest) => void;
    vi.mocked(cargaApi.solicitarEnvioOrganogramaProdest).mockReturnValue(new Promise((resolve) => { resolveRequest = resolve; }));
    renderPage();
    await userEvent.click(await screen.findByRole("radio", { name: /Selecionar Estrutura vigente/i }));
    await userEvent.click(screen.getByRole("button", { name: /Continuar/i }));
    await userEvent.click(screen.getByRole("button", { name: /Continuar/i }));
    const submit = screen.getByRole("button", { name: "Iniciar simulação" });
    fireEvent.click(submit);
    fireEvent.click(submit);
    expect(cargaApi.solicitarEnvioOrganogramaProdest).toHaveBeenCalledOnce();
    resolveRequest(envio());
  });

  it("exige confirmação adicional para o envio definitivo", async () => {
    renderPage();
    await userEvent.click(await screen.findByRole("radio", { name: /Selecionar Estrutura vigente/i }));
    await userEvent.click(screen.getByRole("button", { name: /Continuar/i }));
    await userEvent.click(screen.getByRole("radio", { name: /Envio definitivo/i }));
    await userEvent.click(screen.getByRole("button", { name: /Continuar/i }));
    await userEvent.click(screen.getByRole("button", { name: "Iniciar envio definitivo" }));
    const dialog = screen.getByRole("dialog", { name: /Enviar definitivamente/i });
    await userEvent.click(within(dialog).getByRole("button", { name: "Confirmar envio definitivo" }));
    await waitFor(() => expect(cargaApi.solicitarEnvioOrganogramaProdest).toHaveBeenCalledWith(10, false));
  });

  it("retoma automaticamente uma tentativa ativa e não oferece novo envio", async () => {
    vi.mocked(cargaApi.getAcompanhamentoEnvioOrganograma).mockResolvedValue({
      patriarca_id: 1,
      tentativa_ativa: envio(),
      ultimo_resultado: null,
      bloqueio_novo_envio: true,
      motivo_bloqueio: "Existe uma carga inicial em processamento.",
      eventos_recentes: [],
    });
    renderPage();
    expect(await screen.findByText("Envio em andamento")).toBeInTheDocument();
    expect(screen.getByText("Existe uma carga inicial em processamento.")).toBeInTheDocument();
    expect(screen.queryByText("Qual organograma deseja enviar?")).not.toBeInTheDocument();
    expect(cargaApi.consultarStatusEnvioOrganogramaProdest).not.toHaveBeenCalled();
  });

  it("abre o histórico somente quando solicitado", async () => {
    vi.mocked(cargaApi.listEnviosOrganogramaProdest).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [envio({ strstatus: "CONCLUIDO", status_nome: "Concluído" })],
    });
    renderPage();
    expect(screen.queryByText("Tentativas de envio")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Consultar histórico" }));
    expect(await screen.findByText("Tentativas de envio")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Acompanhar" }));
    expect(cargaApi.getEnvioOrganogramaProdest).toHaveBeenCalledWith(15);
  });

  it("mantém acompanhamento para quem não possui permissão de alteração", async () => {
    canChange = false;
    renderPage();
    await userEvent.click(await screen.findByRole("radio", { name: /Selecionar Estrutura vigente/i }));
    await userEvent.click(screen.getByRole("button", { name: /Continuar/i }));
    await userEvent.click(screen.getByRole("button", { name: /Continuar/i }));
    expect(screen.getByRole("button", { name: "Iniciar simulação" })).toBeDisabled();
    expect(screen.getByText(/acesso para acompanhar os envios/i)).toBeInTheDocument();
  });

  it("explica uma conclusão cuja origem local ficou desatualizada", async () => {
    const outdated = envio({
      strstatus: "CONCLUIDO_DESATUALIZADO",
      status_nome: "Concluído, mas desatualizado",
      fase_atual: "CONCLUSAO",
      strfaseatual: "CONCLUSAO",
      fase_atual_nome: "Conclusão",
      status_atual: "AVISO",
      status_atual_nome: "Aviso",
    });
    vi.mocked(cargaApi.getAcompanhamentoEnvioOrganograma).mockResolvedValue({
      patriarca_id: 1,
      tentativa_ativa: null,
      ultimo_resultado: outdated,
      bloqueio_novo_envio: false,
      motivo_bloqueio: "",
      eventos_recentes: [],
    });
    renderPage();
    expect(await screen.findByText(/A carga foi concluída, mas o organograma local foi alterado depois/i)).toBeInTheDocument();
  });

  it("oferece nova tentativa somente quando autorizada pelo backend", async () => {
    const failed = envio({
      strstatus: "ERRO",
      status_nome: "Erro",
      status_atual: "ERRO",
      status_atual_nome: "Erro",
      strmensagemerro: "A PRODEST recusou a solicitação.",
      acoes_disponiveis: {
        consultar_detalhes: true,
        consultar_status: false,
        consultar_relatorio: false,
        tentar_novamente: true,
      },
    });
    vi.mocked(cargaApi.getAcompanhamentoEnvioOrganograma).mockResolvedValue({
      patriarca_id: 1,
      tentativa_ativa: null,
      ultimo_resultado: failed,
      bloqueio_novo_envio: false,
      motivo_bloqueio: "",
      eventos_recentes: [],
    });
    renderPage();
    expect(await screen.findByText("A PRODEST recusou a solicitação.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
  });
});
