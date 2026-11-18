import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EnvioProdestActivityPanel } from "@/features/carga-org-lot/EnvioProdestActivityPanel";
import type {
  EnvioOrganogramaProdest,
  EtapaFluxoOperacional,
  EventoIntegracaoProdest,
  FluxoOperacionalProdest,
} from "@/features/carga-org-lot/model";

function stage(
  overrides: Partial<EtapaFluxoOperacional> = {},
): EtapaFluxoOperacional {
  return {
    codigo: "PREPARACAO",
    nome: "Preparação recebida",
    ordem: 1,
    status: "SUCESSO",
    status_nome: "Sucesso",
    mensagem: "Payload preparado.",
    data_ultima_atividade: "2026-10-29T12:00:00Z",
    atual: false,
    ...overrides,
  };
}

function submission(workflow: FluxoOperacionalProdest): EnvioOrganogramaProdest {
  return {
    fluxo_operacional: workflow,
    datultimaatividade: "2026-10-29T12:00:00Z",
    fase_atual_nome: "Valor legado que não deve aparecer",
    mensagem_atual: "Mensagem legada que não deve aparecer.",
  } as EnvioOrganogramaProdest;
}

function renderPanel(
  workflow: FluxoOperacionalProdest,
  eventos: EventoIntegracaoProdest[] = [],
) {
  return render(
    <EnvioProdestActivityPanel
      envio={submission(workflow)}
      eventos={eventos}
      realtimeStatus="connected"
      isLoading={false}
    />,
  );
}

describe("acompanhamento canônico do envio à PRODEST", () => {
  it("prefere os detalhes preparados pelo backend e mantém o fallback legado", () => {
    const preparedEvent = {
      ideventointegracao: 92,
      strstatusoperacional: "AVISO",
      strtitulo: "Processamento remoto sem atualização",
      strmensagem: "A PRODEST ainda não atualizou a carga.",
      fase_exibicao_nome: "Processamento",
      jsondetalhes: {
        ultima_atualizacao_prodest: "2026-10-29T13:44:03.0413547",
      },
      jsondetalhes_exibicao: {
        ultima_atualizacao_prodest: "29/10/2026 10:44:03",
      },
      datocorrencia: "2026-10-29T16:42:00Z",
    } as unknown as EventoIntegracaoProdest;
    const legacyEvent = {
      ...preparedEvent,
      ideventointegracao: 93,
      strtitulo: "Evento legado",
      jsondetalhes: { origem: "Detalhe técnico legado" },
      jsondetalhes_exibicao: undefined,
    } as EventoIntegracaoProdest;

    renderPanel({
      fase_atual: "PROCESSAMENTO",
      fase_atual_nome: "Processamento",
      status_atual: "AVISO",
      status_atual_nome: "Aviso",
      mensagem_atual: "Aguardando a PRODEST.",
      etapas: [],
    }, [preparedEvent, legacyEvent]);

    expect(screen.getByText("29/10/2026 10:44:03")).toBeInTheDocument();
    expect(screen.queryByText("2026-10-29T13:44:03.0413547")).not.toBeInTheDocument();
    expect(screen.getByText("Detalhe técnico legado")).toBeInTheDocument();
  });

  it("diferencia atividade, consulta e conexão ao representar espera remota", () => {
    const envio = {
      ...submission({
        fase_atual: "PROCESSAMENTO",
        fase_atual_nome: "Processamento",
        status_atual: "EM_ANDAMENTO",
        status_atual_nome: "Em andamento",
        mensagem_atual: "A PRODEST está processando a carga.",
        etapas: [],
      }),
      strstatus: "PROCESSANDO",
      finalizada_prodest: false,
      datultimaatividade: "2026-10-29T16:42:00Z",
      datultimaconsulta: "2026-10-29T17:00:00Z",
    } as EnvioOrganogramaProdest;
    const staleEvent = {
      ideventointegracao: 94,
      strcodigo: "PROCESSAMENTO_SEM_ATUALIZACAO",
      strstatusoperacional: "AVISO",
      strtitulo: "Processamento remoto sem atualização",
      strmensagem: "A PRODEST continua respondendo.",
      fase_exibicao_nome: "Processamento",
      jsondetalhes: {},
      datocorrencia: "2026-10-29T16:42:00Z",
    } as EventoIntegracaoProdest;

    render(
      <EnvioProdestActivityPanel
        envio={envio}
        eventos={[staleEvent]}
        realtimeStatus="connected"
        isLoading={false}
      />,
    );

    expect(screen.getByRole("heading", { name: "Aguardando atualização da PRODEST" })).toBeInTheDocument();
    expect(screen.getByText("Processamento sem atualização")).toBeInTheDocument();
    expect(screen.getByText("Última atividade registrada")).toBeInTheDocument();
    expect(screen.getByText("Última consulta à PRODEST")).toBeInTheDocument();
    expect(screen.getByText("Ao vivo · backend")).toBeInTheDocument();
    expect(screen.queryByText(/monitoramento ativo/i)).not.toBeInTheDocument();
  });

  it("mantém o painel disponível enquanto recupera um fluxo ausente", () => {
    const legacySubmission = {
      idenvioorganograma: 15,
      datultimaatividade: "2026-10-29T12:00:00Z",
    } as EnvioOrganogramaProdest;

    render(
      <EnvioProdestActivityPanel
        envio={legacySubmission}
        eventos={[]}
        realtimeStatus="connected"
        isLoading={false}
      />,
    );

    expect(screen.getByRole("heading", { name: "Atualizando acompanhamento" })).toBeInTheDocument();
    expect(screen.getByText(/Recuperando do servidor as etapas atualizadas/i)).toBeInTheDocument();
    expect(screen.getByText(/As etapas serão informadas pelo servidor/i)).toBeInTheDocument();
  });

  it.each([
    ["NOVO", "Um novo acesso seguro foi obtido junto ao Acesso Cidadão."],
    ["CACHE_COMPARTILHADO", "A credencial segura ainda válida foi reutilizada."],
  ] as const)("exibe a autenticação com token %s conforme recebida", (origin, message) => {
    renderPanel({
      fase_atual: "AUTENTICACAO",
      fase_atual_nome: "Autenticação segura",
      status_atual: "SUCESSO",
      status_atual_nome: "Sucesso",
      mensagem_atual: message,
      etapas: [stage({
        codigo: "AUTENTICACAO",
        nome: "Autenticação segura",
        status: "SUCESSO",
        mensagem: message,
        atual: true,
        origem_autenticacao: origin,
      })],
    });

    expect(screen.getAllByText(message)).toHaveLength(2);
    expect(screen.queryByText("Mensagem legada que não deve aparecer.")).not.toBeInTheDocument();
  });

  it("renderiza estados e a sequência integralmente pelo array recebido", () => {
    renderPanel({
      fase_atual: "CONCLUSAO",
      fase_atual_nome: "Conclusão fornecida pelo backend",
      status_atual: "AVISO",
      status_atual_nome: "Atenção",
      mensagem_atual: "Concluído com ressalva.",
      etapas: [
        stage({
          codigo: "PROCESSAMENTO",
          nome: "Processamento remoto",
          ordem: 8,
          status: "ERRO",
          status_nome: "Erro confirmado",
          mensagem: "O processamento remoto falhou.",
        }),
        stage({
          codigo: "CONCLUSAO",
          nome: "Conclusão especial",
          ordem: 3,
          status: "AVISO",
          status_nome: "Atenção",
          mensagem: "Concluído com ressalva.",
          atual: true,
        }),
      ],
    });

    expect(screen.getByRole("heading", { name: "Conclusão fornecida pelo backend" })).toBeInTheDocument();
    expect(screen.getByText("Processamento remoto")).toBeInTheDocument();
    expect(screen.getByText("Erro confirmado")).toBeInTheDocument();
    expect(screen.getByText("Conclusão especial")).toBeInTheDocument();
    expect(screen.queryByText("Preparação")).not.toBeInTheDocument();
    expect(screen.queryByText("Valor legado que não deve aparecer")).not.toBeInTheDocument();
  });

  it("exibe a fase canônica de um erro 403 no envio, preservando a fase histórica", () => {
    const event = {
      ideventointegracao: 91,
      strstatusoperacional: "ERRO",
      strtitulo: "Envio rejeitado",
      strmensagem: "A PRODEST recusou o envio do organograma.",
      strfase: "AUTENTICACAO",
      fase_nome: "Autenticação",
      fase_exibicao: "ENVIO",
      fase_exibicao_nome: "Envio",
      jsondetalhes: {},
      datocorrencia: "2026-10-29T12:00:00Z",
    } as EventoIntegracaoProdest;

    renderPanel({
      fase_atual: "ENVIO",
      fase_atual_nome: "Envio",
      status_atual: "ERRO",
      status_atual_nome: "Erro",
      mensagem_atual: "A PRODEST recusou o envio do organograma.",
      etapas: [stage({
        codigo: "ENVIO",
        nome: "Envio",
        status: "ERRO",
        status_nome: "Erro",
        mensagem: "A PRODEST recusou o envio do organograma.",
        atual: true,
      })],
    }, [event]);

    expect(screen.getAllByText("Envio")).toHaveLength(3);
    expect(screen.queryByText("Autenticação")).not.toBeInTheDocument();
  });
});
