import { SWRConfig } from "swr";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EnvioOrganogramaProdestPage } from "@/features/carga-org-lot/EnvioOrganogramaProdestPage";
import * as cargaApi from "@/features/carga-org-lot/api";
import type {
  EnvioOrganogramaProdest,
  ImportacaoPlanilha,
  MensagemWebSocketProdest,
} from "@/features/carga-org-lot/model";

let realtimeOnMessage: ((message: MensagemWebSocketProdest) => void) | null = null;

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
vi.mock("@/features/carga-org-lot/useProdestRealtime", () => ({
  useProdestRealtime: ({
    onMessage,
  }: {
    onMessage: (message: MensagemWebSocketProdest) => void;
  }) => {
    realtimeOnMessage = onMessage;
    return "connected";
  },
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
    encerrarMonitoramentoEnvioOrganogramaProdest: vi.fn(),
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
    idtentativaanterior_id: null,
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
    fluxo_operacional: {
      fase_atual: "PROCESSAMENTO",
      fase_atual_nome: "Processamento",
      status_atual: "EM_ANDAMENTO",
      status_atual_nome: "Em andamento",
      mensagem_atual: "Carga em processamento na PRODEST.",
      etapas: [
        {
          codigo: "PROCESSAMENTO",
          nome: "Processamento",
          ordem: 4,
          status: "EM_ANDAMENTO",
          status_nome: "Em andamento",
          mensagem: "Carga em processamento na PRODEST.",
          data_ultima_atividade: "2026-10-19T10:01:00Z",
          atual: true,
        },
      ],
    },
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
    datfimmonitoramento: null,
    datencerramentomanual: null,
    strjustificativaencerramento: "",
    flganalistaprodestavisado: null,
    flganalistaprodestrespondeu: null,
    strretornoanalistaprodest: "",
    encerrado_by_id: null,
    encerrado_by_name: "",
    encerramento_monitoramento: {
      permitido: false,
      opcoes_disponiveis: ["CONTINUAR_AGUARDANDO"],
      carencia_segundos: 7200,
      referencia_em: "2026-10-19T10:00:00Z",
      disponivel_em: "2026-10-19T12:00:00Z",
      segundos_restantes: 3600,
      situacao_remota_finalizada: false,
    },
    acoes_disponiveis: {
      consultar_detalhes: true,
      consultar_status: true,
      consultar_relatorio: false,
      tentar_novamente: false,
      encerrar_monitoramento: false,
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

function envioComLiberacao(overrides: Partial<EnvioOrganogramaProdest> = {}) {
  return envio({
    encerramento_monitoramento: {
      permitido: true,
      opcoes_disponiveis: ["CONTINUAR_AGUARDANDO", "LIBERAR_NOVO_ENVIO"],
      carencia_segundos: 7200,
      referencia_em: "2026-10-19T10:00:00Z",
      disponivel_em: "2026-10-19T12:00:00Z",
      segundos_restantes: 0,
      situacao_remota_finalizada: false,
    },
    acoes_disponiveis: {
      consultar_detalhes: true,
      consultar_status: true,
      consultar_relatorio: false,
      tentar_novamente: false,
      encerrar_monitoramento: true,
    },
    ...overrides,
  });
}

function acompanhamentoAtivo(attempt: EnvioOrganogramaProdest) {
  return {
    patriarca_id: 1,
    tentativa_ativa: attempt,
    ultimo_resultado: null,
    bloqueio_novo_envio: true,
    motivo_bloqueio: "Existe uma carga inicial em processamento.",
    eventos_recentes: [],
  };
}

async function preencherLiberacaoBasica(dialog: HTMLElement) {
  await userEvent.type(
    within(dialog).getByRole("textbox", { name: "Justificativa" }),
    "Carga sem atualização há vários dias.",
  );
  const notified = within(dialog).getByRole("group", { name: "O analista da PRODEST foi avisado?" });
  await userEvent.click(within(notified).getByRole("radio", { name: "Não" }));
  await userEvent.click(within(dialog).getByRole("checkbox", { name: /Estou ciente de que esta ação não cancela/i }));
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
    realtimeOnMessage = null;
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
    vi.mocked(cargaApi.encerrarMonitoramentoEnvioOrganogramaProdest).mockResolvedValue(envio());
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

  it("recupera o fluxo canônico quando a criação retorna um objeto legado", async () => {
    vi.mocked(cargaApi.solicitarEnvioOrganogramaProdest).mockResolvedValue(
      envio({ fluxo_operacional: undefined }),
    );
    vi.mocked(cargaApi.getEnvioOrganogramaProdest).mockResolvedValue(envio());
    renderPage();

    await userEvent.click(await screen.findByRole("radio", { name: /Selecionar Estrutura vigente/i }));
    await userEvent.click(screen.getByRole("button", { name: /Continuar/i }));
    await userEvent.click(screen.getByRole("button", { name: /Continuar/i }));
    await userEvent.click(screen.getByRole("button", { name: "Iniciar simulação" }));

    await waitFor(() => expect(cargaApi.getEnvioOrganogramaProdest).toHaveBeenCalledWith(15));
    expect(await screen.findByRole("heading", { name: "Processamento" })).toBeInTheDocument();
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
    expect(screen.queryByRole("button", { name: "Liberar novo envio" })).not.toBeInTheDocument();
    expect(cargaApi.consultarStatusEnvioOrganogramaProdest).not.toHaveBeenCalled();
  });

  it("usa o WebSocket apenas para revalidar o acompanhamento canônico", async () => {
    const canonical = envio();
    vi.mocked(cargaApi.getAcompanhamentoEnvioOrganograma).mockResolvedValue({
      patriarca_id: 1,
      tentativa_ativa: canonical,
      ultimo_resultado: null,
      bloqueio_novo_envio: true,
      motivo_bloqueio: "Existe uma carga inicial em processamento.",
      eventos_recentes: [],
    });
    renderPage();
    expect(await screen.findByText("Envio em andamento")).toBeInTheDocument();
    const callsBeforeMessage = vi.mocked(cargaApi.getAcompanhamentoEnvioOrganograma).mock.calls.length;

    act(() => {
      realtimeOnMessage?.({
        tipo: "processo_atualizado",
        processo: {
          processo_id: 3,
          patriarca_id: 1,
          tipo_carga: "ORGANOGRAMA",
          envio_id: 15,
          fase_atual: "CONCLUSAO",
          fase_atual_nome: "Conclusão não canônica",
          status_atual: "SUCESSO",
          status_atual_nome: "Sucesso",
          mensagem_atual: "Mensagem recebida apenas pelo WebSocket.",
          datultimaatividade: "2026-10-29T18:00:00Z",
          ultimo_evento_id: 92,
        },
      });
    });

    await waitFor(() => expect(
      vi.mocked(cargaApi.getAcompanhamentoEnvioOrganograma).mock.calls.length,
    ).toBeGreaterThan(callsBeforeMessage));
    expect(screen.queryByText("Conclusão não canônica")).not.toBeInTheDocument();
    expect(screen.queryByText("Mensagem recebida apenas pelo WebSocket.")).not.toBeInTheDocument();
    expect(screen.getAllByText("Processamento").length).toBeGreaterThan(0);
  });

  it("consulta a situação agora e substitui os dados pela fonte canônica", async () => {
    const staleEvent = {
      ideventointegracao: 91,
      idenvioorganograma_id: 15,
      strvisibilidade: "OPERACIONAL",
      strcodigo: "PROCESSAMENTO_SEM_ATUALIZACAO",
      strstatusoperacional: "AVISO",
      strtitulo: "Processamento remoto sem atualização",
      strmensagem: "A PRODEST continua respondendo.",
      fase_exibicao_nome: "Processamento",
      jsondetalhes: {},
      jsondetalhes_exibicao: { ultima_atualizacao_prodest: "29/10/2026 10:44:03" },
      datocorrencia: "2026-10-29T16:42:00Z",
    };
    let canonical = envio({
      datultimaatividade: "2026-10-29T16:42:00Z",
      datultimaconsulta: "2026-10-29T16:45:00Z",
    });
    vi.mocked(cargaApi.getAcompanhamentoEnvioOrganograma).mockImplementation(async () => ({
      patriarca_id: 1,
      tentativa_ativa: canonical,
      ultimo_resultado: null,
      bloqueio_novo_envio: true,
      motivo_bloqueio: "Existe uma carga inicial em processamento.",
      eventos_recentes: [staleEvent] as never[],
    }));
    vi.mocked(cargaApi.listEventosEnvioOrganograma).mockResolvedValue({
      idenvioorganograma: 15,
      ultimo_evento_id: 91,
      possui_mais: false,
      eventos: [staleEvent] as never[],
    });
    vi.mocked(cargaApi.consultarStatusEnvioOrganogramaProdest).mockImplementation(async () => {
      canonical = envio({
        datultimaatividade: "2026-10-29T16:42:00Z",
        datultimaconsulta: "2026-10-29T17:05:00Z",
      });
      return canonical;
    });

    renderPage();

    expect(await screen.findByRole("button", { name: "Consultar situação agora" })).toBeInTheDocument();
    expect(screen.getAllByText("Última atividade registrada").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Última consulta à PRODEST").length).toBeGreaterThan(0);
    expect((await screen.findAllByText("29/10/2026 10:44:03")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Aguardando atualização da PRODEST")).length).toBeGreaterThan(0);
    expect(screen.queryByText("Qual organograma deseja enviar?")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Consultar situação agora" }));

    await waitFor(() => expect(cargaApi.consultarStatusEnvioOrganogramaProdest).toHaveBeenCalledWith(15));
    await waitFor(() => expect(cargaApi.getAcompanhamentoEnvioOrganograma).toHaveBeenCalledTimes(2));
    expect(cargaApi.listEventosEnvioOrganograma).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Consultar situação agora" })).toBeEnabled();
  });

  it("oferece a escolha somente quando o backend autoriza e continuar aguardando não chama endpoint", async () => {
    vi.mocked(cargaApi.getAcompanhamentoEnvioOrganograma).mockResolvedValue(
      acompanhamentoAtivo(envioComLiberacao()),
    );
    renderPage();

    expect(await screen.findByText("A carga continua sem atualização da PRODEST.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Liberar novo envio" })).toBeInTheDocument();
    expect(screen.queryByText("Aguardando atualização da PRODEST")).not.toBeInTheDocument();
    expect(screen.queryByText("Existe uma carga inicial em processamento.")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Continuar aguardando" }));

    expect(cargaApi.encerrarMonitoramentoEnvioOrganogramaProdest).not.toHaveBeenCalled();
    expect(screen.queryByText("A carga continua sem atualização da PRODEST.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Consultar situação agora" })).toBeInTheDocument();
  });

  it("protege a liberação com justificativa, risco e dados coerentes do analista", async () => {
    vi.mocked(cargaApi.getAcompanhamentoEnvioOrganograma).mockResolvedValue(
      acompanhamentoAtivo(envioComLiberacao()),
    );
    vi.mocked(cargaApi.encerrarMonitoramentoEnvioOrganogramaProdest).mockResolvedValue(envio({
      strstatus: "SITUACAO_REMOTA_INDETERMINADA",
      status_nome: "Situação remota indeterminada",
    }));
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "Liberar novo envio" }));
    const dialog = screen.getByRole("dialog", { name: "Liberar novo envio" });
    const confirm = within(dialog).getByRole("button", { name: "Confirmar e liberar novo envio" });
    expect(confirm).toBeDisabled();

    await userEvent.type(within(dialog).getByRole("textbox", { name: "Justificativa" }), "Curta");
    expect(confirm).toBeDisabled();
    await userEvent.clear(within(dialog).getByRole("textbox", { name: "Justificativa" }));
    await userEvent.type(within(dialog).getByRole("textbox", { name: "Justificativa" }), "Carga sem atualização há vários dias.");

    const notified = within(dialog).getByRole("group", { name: "O analista da PRODEST foi avisado?" });
    expect(within(dialog).getByRole("group", { name: "O analista respondeu?" })).toBeDisabled();
    await userEvent.click(within(notified).getByRole("radio", { name: "Sim" }));
    const replied = within(dialog).getByRole("group", { name: "O analista respondeu?" });
    await userEvent.click(within(replied).getByRole("radio", { name: "Sim" }));
    await userEvent.click(within(dialog).getByRole("checkbox", { name: /Estou ciente de que esta ação não cancela/i }));
    expect(confirm).toBeDisabled();

    await userEvent.type(
      within(dialog).getByRole("textbox", { name: "Orientação fornecida pelo analista" }),
      "Orientou realizar um novo envio.",
    );
    expect(confirm).toBeEnabled();
    await userEvent.click(confirm);

    await waitFor(() => expect(cargaApi.encerrarMonitoramentoEnvioOrganogramaProdest).toHaveBeenCalledWith(15, {
      justificativa: "Carga sem atualização há vários dias.",
      confirmar_risco_processamento_remoto: true,
      analista_prodest_avisado: true,
      analista_prodest_respondeu: true,
      retorno_analista_prodest: "Orientou realizar um novo envio.",
    }));
  });

  it("libera o novo envio somente após a fonte canônica remover o bloqueio", async () => {
    const active = envioComLiberacao();
    const closed = envio({
      strstatus: "SITUACAO_REMOTA_INDETERMINADA",
      status_nome: "Situação remota indeterminada",
      finalizada_prodest: false,
      datencerramentomanual: "2026-10-19T14:15:00Z",
      encerrado_by_id: 2,
      encerrado_by_name: "Maria",
      strjustificativaencerramento: "Carga sem atualização há vários dias.",
      flganalistaprodestavisado: false,
      flganalistaprodestrespondeu: false,
      acoes_disponiveis: {
        consultar_detalhes: true,
        consultar_status: false,
        consultar_relatorio: false,
        tentar_novamente: false,
        encerrar_monitoramento: false,
      },
    });
    let released = false;
    vi.mocked(cargaApi.getAcompanhamentoEnvioOrganograma).mockImplementation(async () => released
      ? {
          patriarca_id: 1,
          tentativa_ativa: null,
          ultimo_resultado: closed,
          bloqueio_novo_envio: false,
          motivo_bloqueio: "",
          eventos_recentes: [],
        }
      : acompanhamentoAtivo(active));
    vi.mocked(cargaApi.encerrarMonitoramentoEnvioOrganogramaProdest).mockImplementation(async () => {
      released = true;
      return closed;
    });
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "Liberar novo envio" }));
    const dialog = screen.getByRole("dialog", { name: "Liberar novo envio" });
    await preencherLiberacaoBasica(dialog);
    await userEvent.click(within(dialog).getByRole("button", { name: "Confirmar e liberar novo envio" }));

    expect(await screen.findByText(/Acompanhamento local encerrado\. A situação da carga anterior/i)).toBeInTheDocument();
    expect(await screen.findByText("Qual organograma deseja enviar?")).toBeInTheDocument();
    expect(screen.getByText("Situação remota indeterminada")).toBeInTheDocument();
    expect(screen.getByText("Carga sem atualização há vários dias.")).toBeInTheDocument();
  });

  it("registra a conclusão normal quando a PRODEST finaliza na última consulta", async () => {
    const active = envioComLiberacao();
    const concluded = envio({
      strstatus: "CONCLUIDO",
      status_nome: "Concluído",
      finalizada_prodest: true,
    });
    let concludedRemotely = false;
    vi.mocked(cargaApi.getAcompanhamentoEnvioOrganograma).mockImplementation(async () => concludedRemotely
      ? {
          patriarca_id: 1,
          tentativa_ativa: null,
          ultimo_resultado: concluded,
          bloqueio_novo_envio: false,
          motivo_bloqueio: "",
          eventos_recentes: [],
        }
      : acompanhamentoAtivo(active));
    vi.mocked(cargaApi.encerrarMonitoramentoEnvioOrganogramaProdest).mockImplementation(async () => {
      concludedRemotely = true;
      return concluded;
    });
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "Liberar novo envio" }));
    const dialog = screen.getByRole("dialog", { name: "Liberar novo envio" });
    await preencherLiberacaoBasica(dialog);
    await userEvent.click(within(dialog).getByRole("button", { name: "Confirmar e liberar novo envio" }));

    expect(await screen.findByText(/A PRODEST concluiu o processamento durante a última consulta/i)).toBeInTheDocument();
    expect(screen.queryByText(/A situação da carga anterior na PRODEST permanece indeterminada/i)).not.toBeInTheDocument();
  });

  it("fecha a confirmação, informa o conflito e revalida quando a carência ainda não terminou", async () => {
    vi.mocked(cargaApi.getAcompanhamentoEnvioOrganograma).mockResolvedValue(
      acompanhamentoAtivo(envioComLiberacao()),
    );
    vi.mocked(cargaApi.encerrarMonitoramentoEnvioOrganogramaProdest).mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          success: false,
          errors: {
            code: "envio_organograma_conflict",
            message: "O acompanhamento ainda não pode ser encerrado.",
          },
        },
      },
    });
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "Liberar novo envio" }));
    const dialog = screen.getByRole("dialog", { name: "Liberar novo envio" });
    await preencherLiberacaoBasica(dialog);
    await userEvent.click(within(dialog).getByRole("button", { name: "Confirmar e liberar novo envio" }));

    expect(await screen.findByText("O acompanhamento ainda não pode ser encerrado.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Liberar novo envio" })).not.toBeInTheDocument();
    expect(vi.mocked(cargaApi.getAcompanhamentoEnvioOrganograma).mock.calls.length).toBeGreaterThan(1);
  });

  it("apresenta erros de validação do backend junto ao campo correspondente", async () => {
    vi.mocked(cargaApi.getAcompanhamentoEnvioOrganograma).mockResolvedValue(
      acompanhamentoAtivo(envioComLiberacao()),
    );
    vi.mocked(cargaApi.encerrarMonitoramentoEnvioOrganogramaProdest).mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 400,
        data: { justificativa: ["A justificativa foi recusada pelo backend."] },
      },
    });
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "Liberar novo envio" }));
    const dialog = screen.getByRole("dialog", { name: "Liberar novo envio" });
    await preencherLiberacaoBasica(dialog);
    await userEvent.click(within(dialog).getByRole("button", { name: "Confirmar e liberar novo envio" }));

    expect(await within(dialog).findByText("A justificativa foi recusada pelo backend.")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Liberar novo envio" })).toBeInTheDocument();
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
        encerrar_monitoramento: false,
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
