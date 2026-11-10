import { SWRConfig } from "swr";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EflowDetailsDialog } from "@/features/publicacoes/eflow/EflowDetailsDialog";
import * as eflowApi from "@/features/publicacoes/eflow/api";
import type {
  ColetaEflow,
  PreferenciaExibicaoEflow,
} from "@/features/publicacoes/eflow/model";

vi.mock("@/features/publicacoes/eflow/api", async (importOriginal) => {
  const original = await importOriginal<
    typeof import("@/features/publicacoes/eflow/api")
  >();
  return {
    ...original,
    alterarMinhaPreferenciaEflow: vi.fn(),
    listDefinicoesEflow: vi.fn(),
    listAuditoriaEflow: vi.fn(),
    listAuditoriaPreferenciaEflow: vi.fn(),
  };
});

const completeResult = {
  id: 1,
  coleta_id: "11111111-1111-1111-1111-111111111111",
  perfil: "COMPLETO_TECNICO" as const,
  quantidade_fluxos: 1016,
  quantidade_orgaos_participantes: 69,
  quantidade_setores_ativos: 182,
  orgaos_maior_quantidade_fluxos: [
    {
      patriarca: "SEGER",
      orgao: "SEGER - Secretaria de Gestão",
      quantidade_fluxos: 904,
      percentual: "88.98",
    },
    {
      patriarca: null,
      orgao: "Outros",
      quantidade_fluxos: 112,
      percentual: "11.02",
    },
  ],
  distribuicao_publico_alvo: [
    { publico_alvo: "Cidadão", quantidade_fluxos: 700, percentual: "68.90" },
    { publico_alvo: "Setor", quantidade_fluxos: 316, percentual: "31.10" },
  ],
  calculado_em: "2026-11-10T12:01:00Z",
};
const consolidatedResult = {
  id: 2,
  coleta_id: completeResult.coleta_id,
  perfil: "CONSOLIDADO_PUBLICACAO" as const,
  quantidade_fluxos: 1016,
  quantidade_orgaos_participantes: 67,
  quantidade_setores_ativos: 176,
  orgaos_maior_quantidade_fluxos: [
    {
      patriarca: null,
      orgao: "SEGER - Secretaria de Gestão",
      quantidade_fluxos: 600,
      percentual: "66.67",
    },
    {
      patriarca: null,
      orgao: "SESA - Secretaria da Saúde",
      quantidade_fluxos: 300,
      percentual: "33.33",
    },
  ],
  distribuicao_publico_alvo: [
    { publico_alvo: "Cidadão", quantidade_fluxos: 800, percentual: "78.74" },
    { publico_alvo: "Órgão", quantidade_fluxos: 216, percentual: "21.26" },
  ],
  calculado_em: "2026-11-10T12:01:00Z",
};
const coleta: ColetaEflow = {
  id: completeResult.coleta_id,
  situacao: "CONCLUIDA",
  arquivo_nome: "snapshot.csv",
  arquivo_hash_sha256: "a".repeat(64),
  arquivo_tamanho_bytes: 4096,
  iniciada_em: "2026-11-10T12:00:00Z",
  concluida_em: "2026-11-10T12:01:00Z",
  quantidade_fluxos: 1016,
  quantidade_orgaos_participantes: 69,
  quantidade_setores_ativos: 182,
  orgaos_maior_quantidade_fluxos: completeResult.orgaos_maior_quantidade_fluxos,
  distribuicao_publico_alvo: completeResult.distribuicao_publico_alvo,
  codigo_erro: "",
  mensagem_erro: "",
  resultados_calculo: [completeResult, consolidatedResult],
  criado_por_id: 7,
  criado_por_nome: "Gestora",
};
const preference: PreferenciaExibicaoEflow = {
  id: 1,
  usuario_id: 7,
  perfil_preferido: "CONSOLIDADO_PUBLICACAO",
  atualizado_em: "2026-11-10T12:00:00Z",
  atualizado_por_id: 7,
  atualizado_por_nome: "Gestora",
  acoes_disponiveis: ["alterar_preferencia_exibicao"],
};
const definition = {
  id: 1,
  coleta_id: coleta.id,
  id_externo: "22222222-2222-2222-2222-222222222222",
  nome: "Fluxo de teste",
  versao_origem: 3,
  publico_alvo: "Cidadão",
  patriarca_id: 10,
  patriarca_sigla: "SEGER",
  patriarca_nome: "Secretaria de Gestão",
  patriarca_texto: "SEGER - Secretaria de Gestão",
  orgao: "Órgão A",
  setor: "Setor B",
};
const snapshotEvent = {
  id: 1,
  coleta_id: coleta.id,
  tipo_evento: "COLETA_CONCLUIDA",
  mensagem: "A coleta foi concluída.",
  metadados: { quantidade_fluxos: 1016 },
  criado_por_id: 7,
  criado_por_nome: "Gestora",
  criado_em: "2026-11-10T12:01:00Z",
};
const preferenceEvent = {
  id: 2,
  preferencia_id: preference.id,
  tipo_evento: "PREFERENCIA_INICIALIZADA" as const,
  perfil_anterior: null,
  perfil_atual: "CONSOLIDADO_PUBLICACAO" as const,
  criado_por_id: 7,
  criado_por_nome: "Gestora",
  criado_em: "2026-11-10T11:59:00Z",
};

function setup({
  currentColeta = coleta,
  currentPreference = preference,
  canViewDefinitions = false,
  canViewAudit = false,
  canViewPreferenceAudit = false,
  canChangePreference = true,
  onPreferenceChanged = vi.fn().mockResolvedValue(undefined),
} = {}) {
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <EflowDetailsDialog
        coleta={currentColeta}
        preference={currentPreference}
        canViewResults
        canChangePreference={canChangePreference}
        canViewPreferenceAudit={canViewPreferenceAudit}
        canViewDefinitions={canViewDefinitions}
        canViewAudit={canViewAudit}
        onPreferenceChanged={onPreferenceChanged}
        onClose={vi.fn()}
      />
    </SWRConfig>,
  );
  return { onPreferenceChanged };
}

describe("detalhes da coleta E-Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(eflowApi.alterarMinhaPreferenciaEflow).mockResolvedValue(
      preference,
    );
    vi.mocked(eflowApi.listDefinicoesEflow).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [definition],
    });
    vi.mocked(eflowApi.listAuditoriaEflow).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [snapshotEvent],
    });
    vi.mocked(eflowApi.listAuditoriaPreferenciaEflow).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [preferenceEvent],
    });
  });

  it("abre o perfil preferido e compara os dois resultados sem recalcular", () => {
    setup();

    expect(screen.getByRole("dialog").querySelector("section")).toHaveClass(
      "max-w-7xl",
    );
    expect(
      screen.getByRole("tab", { name: /Consolidado para publicação/ }),
    ).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Preferido")).toBeInTheDocument();
    expect(screen.getByText("69")).toBeInTheDocument();
    expect(screen.getByText("182")).toBeInTheDocument();
    expect(screen.getAllByText("67").length).toBeGreaterThan(0);
    expect(screen.getAllByText("176").length).toBeGreaterThan(0);
    expect(screen.getByText("600 (66,67%)")).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: /900 fluxos contabilizados nesta visão/,
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Outros")).not.toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(2);
  });

  it("troca a visualização entre perfis usando somente os dados retornados", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("tab", { name: "Completo técnico" }));

    expect(screen.getByRole("tab", { name: "Completo técnico" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Outros")).toBeInTheDocument();
    expect(screen.getByText("112 (11,02%)")).toBeInTheDocument();
    expect(screen.getByText("SEGER")).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: /1\.016 fluxos contabilizados nesta visão/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("img", {
        name: /900 fluxos contabilizados nesta visão/,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("SEGER - Secretaria de Gestão"),
    ).not.toBeInTheDocument();
  });

  it("persiste a preferência por PATCH sem justificativa e atualiza o cache", async () => {
    const user = userEvent.setup();
    const onPreferenceChanged = vi.fn().mockResolvedValue(undefined);
    const updated = { ...preference, perfil_preferido: "COMPLETO_TECNICO" as const };
    vi.mocked(eflowApi.alterarMinhaPreferenciaEflow).mockResolvedValue(updated);
    setup({ onPreferenceChanged });

    await user.click(screen.getByRole("tab", { name: "Completo técnico" }));
    await user.click(
      screen.getByRole("button", { name: "Definir como minha preferência" }),
    );

    expect(eflowApi.alterarMinhaPreferenciaEflow).toHaveBeenCalledWith(
      "COMPLETO_TECNICO",
    );
    expect(eflowApi.alterarMinhaPreferenciaEflow).toHaveBeenCalledTimes(1);
    expect(onPreferenceChanged).toHaveBeenCalledWith(updated);
    expect(
      await screen.findByText("Sua preferência de exibição foi atualizada."),
    ).toBeInTheDocument();
  });

  it("retorna ao perfil confirmado quando o PATCH falha", async () => {
    const user = userEvent.setup();
    vi.mocked(eflowApi.alterarMinhaPreferenciaEflow).mockRejectedValue(
      new Error("offline"),
    );
    setup();
    await user.click(screen.getByRole("tab", { name: "Completo técnico" }));
    await user.click(
      screen.getByRole("button", { name: "Definir como minha preferência" }),
    );

    expect(
      await screen.findByText(
        "Não foi possível atualizar sua preferência de exibição.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /Consolidado para publicação/ }),
    ).toHaveAttribute("aria-selected", "true");
  });

  it("oculta a ação sem permissão ou sem a ação autorizada pelo backend", async () => {
    const user = userEvent.setup();
    setup({ canChangePreference: false });
    await user.click(screen.getByRole("tab", { name: "Completo técnico" }));
    expect(
      screen.queryByRole("button", { name: "Definir como minha preferência" }),
    ).not.toBeInTheDocument();

    setup({
      currentPreference: { ...preference, acoes_disponiveis: [] },
    });
    const tabs = screen.getAllByRole("tab", { name: "Completo técnico" });
    await user.click(tabs[tabs.length - 1]);
    expect(
      screen.queryByRole("button", { name: "Definir como minha preferência" }),
    ).not.toBeInTheDocument();
  });

  it("não apresenta gráficos nem seletor quando a coleta falhou sem resultados", () => {
    setup({
      currentColeta: {
        ...coleta,
        situacao: "FALHOU",
        codigo_erro: "CSV_INVALIDO",
        mensagem_erro: "Arquivo inválido.",
        resultados_calculo: [],
      },
    });

    expect(screen.getByText("CSV_INVALIDO")).toBeInTheDocument();
    expect(screen.getByText("Arquivo inválido.")).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("consulta definições com coleta_id e paginação do backend", async () => {
    const user = userEvent.setup();
    vi.mocked(eflowApi.listDefinicoesEflow).mockResolvedValue({
      count: 21,
      next: "?page=2",
      previous: null,
      results: [definition],
    });
    setup({ canViewDefinitions: true });

    expect(await screen.findByText("Fluxo de teste")).toBeInTheDocument();
    const section = screen
      .getByRole("heading", { name: "Definições normalizadas" })
      .closest("section")!;
    await user.click(
      within(section).getByRole("button", { name: "Próxima página" }),
    );
    await waitFor(() =>
      expect(eflowApi.listDefinicoesEflow).toHaveBeenLastCalledWith(
        expect.objectContaining({ coleta_id: coleta.id, page: 2, page_size: 20 }),
      ),
    );
  });

  it("mantém a auditoria individual separada da auditoria do snapshot", async () => {
    setup({ canViewAudit: true, canViewPreferenceAudit: true });

    expect(await screen.findByText("A coleta foi concluída.")).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", {
        name: "Histórico da minha preferência",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("PREFERENCIA INICIALIZADA")).toBeInTheDocument();
    expect(eflowApi.listAuditoriaPreferenciaEflow).toHaveBeenCalledWith({
      page: 1,
      page_size: 10,
      ordering: "-criado_em",
    });
  });
});
