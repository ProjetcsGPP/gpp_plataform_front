import { SWRConfig } from "swr";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EflowPage } from "@/features/publicacoes/eflow/EflowPage";
import * as eflowApi from "@/features/publicacoes/eflow/api";
import type { ColetaEflow } from "@/features/publicacoes/eflow/model";
import { PERMISSIONS, type PermissionKey } from "@/lib/permissions";

let routeAllowed = true;
let granted = new Set<PermissionKey>();

vi.mock("@/components/common/RouteGuard", () => ({
  RouteGuard: ({ children }: { children: React.ReactNode }) =>
    routeAllowed ? children : <div>Acesso negado</div>,
}));
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({ can: (permission: PermissionKey) => granted.has(permission) }),
}));
vi.mock("@/features/publicacoes/eflow/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/publicacoes/eflow/api")>();
  return {
    ...original,
    importarColetaEflow: vi.fn(),
    listColetasEflow: vi.fn(),
    listDefinicoesEflow: vi.fn(),
    listAuditoriaEflow: vi.fn(),
    getMinhaPreferenciaEflow: vi.fn(),
    alterarMinhaPreferenciaEflow: vi.fn(),
    listAuditoriaPreferenciaEflow: vi.fn(),
  };
});

const completed: ColetaEflow = {
  id: "11111111-1111-1111-1111-111111111111",
  situacao: "CONCLUIDA",
  arquivo_nome: "eflow.csv",
  arquivo_hash_sha256: "abc123",
  arquivo_tamanho_bytes: 2048,
  iniciada_em: "2026-11-10T12:00:00Z",
  concluida_em: "2026-11-10T12:01:00Z",
  ano_vigencia_inicio: 2024,
  mes_vigencia_inicio: 1,
  vigencia_retroativa: true,
  quantidade_fluxos: 1016,
  quantidade_orgaos_participantes: 25,
  quantidade_setores_ativos: 80,
  orgaos_maior_quantidade_fluxos: [],
  distribuicao_publico_alvo: [],
  codigo_erro: "",
  mensagem_erro: "",
  resultados_calculo: [
    {
      id: 1,
      coleta_id: "11111111-1111-1111-1111-111111111111",
      perfil: "COMPLETO_TECNICO",
      quantidade_fluxos: 1016,
      quantidade_orgaos_participantes: 25,
      quantidade_setores_ativos: 80,
      orgaos_maior_quantidade_fluxos: [],
      distribuicao_publico_alvo: [],
      calculado_em: "2026-11-10T12:01:00Z",
    },
    {
      id: 2,
      coleta_id: "11111111-1111-1111-1111-111111111111",
      perfil: "CONSOLIDADO_PUBLICACAO",
      quantidade_fluxos: 1016,
      quantidade_orgaos_participantes: 23,
      quantidade_setores_ativos: 74,
      orgaos_maior_quantidade_fluxos: [],
      distribuicao_publico_alvo: [],
      calculado_em: "2026-11-10T12:01:00Z",
    },
  ],
  criado_por_id: 7,
  criado_por_nome: "Gestora",
};
const emptyPage = { count: 0, next: null, previous: null, results: [] };

function setup() {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <EflowPage />
    </SWRConfig>,
  );
}

describe("página de coleta E-Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeAllowed = true;
    granted = new Set<PermissionKey>([
      PERMISSIONS.EFLOW_COLETA_VIEW,
      PERMISSIONS.EFLOW_COLETA_IMPORTAR,
      PERMISSIONS.EFLOW_RESULTADO_VIEW,
      PERMISSIONS.EFLOW_PREFERENCIA_VIEW,
      PERMISSIONS.EFLOW_PREFERENCIA_ALTERAR,
      PERMISSIONS.EFLOW_PREFERENCIA_AUDITORIA_VIEW,
    ]);
    vi.mocked(eflowApi.listColetasEflow).mockResolvedValue(emptyPage);
    vi.mocked(eflowApi.listDefinicoesEflow).mockResolvedValue(emptyPage);
    vi.mocked(eflowApi.listAuditoriaEflow).mockResolvedValue(emptyPage);
    vi.mocked(eflowApi.importarColetaEflow).mockResolvedValue(completed);
    vi.mocked(eflowApi.getMinhaPreferenciaEflow).mockResolvedValue({
      id: 1,
      usuario_id: 7,
      perfil_preferido: "CONSOLIDADO_PUBLICACAO",
      atualizado_em: "2026-11-10T12:00:00Z",
      atualizado_por_id: 7,
      atualizado_por_nome: "Gestora",
      acoes_disponiveis: ["alterar_preferencia_exibicao"],
    });
    vi.mocked(eflowApi.listAuditoriaPreferenciaEflow).mockResolvedValue(
      emptyPage,
    );
  });

  it("bloqueia o acesso direto sem a permissão de visualização", () => {
    routeAllowed = false;
    setup();

    expect(screen.getByText("Acesso negado")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Coleta de Dados — E-Flow" })).not.toBeInTheDocument();
  });

  it("exibe a importação somente com importar_coleta_eflow", async () => {
    setup();
    expect(await screen.findByRole("button", { name: "Importar CSV" })).toBeInTheDocument();

    granted = new Set<PermissionKey>([
      PERMISSIONS.EFLOW_COLETA_VIEW,
      PERMISSIONS.EFLOW_PREFERENCIA_VIEW,
      PERMISSIONS.EFLOW_RESULTADO_VIEW,
    ]);
    setup();
    expect(screen.getAllByRole("heading", { name: "Coleta de Dados — E-Flow" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Importar CSV" })).toHaveLength(1);
  });

  it("carrega a preferência consolidada do backend antes de exibir indicadores", async () => {
    vi.mocked(eflowApi.listColetasEflow).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [completed],
    });
    setup();

    expect(eflowApi.getMinhaPreferenciaEflow).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("23")).toBeInTheDocument();
    expect(screen.getByText("74")).toBeInTheDocument();
    expect(screen.queryByText("25")).not.toBeInTheDocument();
    expect(screen.queryByText("80")).not.toBeInTheDocument();
  });

  it("apresenta erro recuperável quando a preferência não pode ser carregada", async () => {
    const user = userEvent.setup();
    vi.mocked(eflowApi.getMinhaPreferenciaEflow).mockRejectedValueOnce(
      new Error("offline"),
    );
    setup();

    expect(
      await screen.findByText("Não foi possível carregar sua preferência E-Flow."),
    ).toBeInTheDocument();
    vi.mocked(eflowApi.getMinhaPreferenciaEflow).mockResolvedValue({
      id: 1,
      usuario_id: 7,
      perfil_preferido: "CONSOLIDADO_PUBLICACAO",
      atualizado_em: "2026-11-10T12:00:00Z",
      atualizado_por_id: 7,
      atualizado_por_nome: "Gestora",
      acoes_disponiveis: ["alterar_preferencia_exibicao"],
    });
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    await waitFor(() =>
      expect(
        screen.queryByText("Não foi possível carregar sua preferência E-Flow."),
      ).not.toBeInTheDocument(),
    );
  });

  it("impede envio sem arquivo e preserva o foco no seletor", async () => {
    setup();
    const input = await screen.findByLabelText("Arquivo CSV");
    const button = screen.getByRole("button", { name: "Importar CSV" });

    expect(button).toBeDisabled();
    input.focus();
    expect(input).toHaveFocus();
    expect(eflowApi.importarColetaEflow).not.toHaveBeenCalled();
  });

  it("envia o CSV e apresenta uma resposta CONCLUIDA estruturada", async () => {
    const user = userEvent.setup();
    setup();
    const input = await screen.findByLabelText("Arquivo CSV");
    const file = new File(["ID;Nome"], "eflow.csv", { type: "text/csv" });

    await user.upload(input, file);
    await user.clear(screen.getByLabelText("Ano de início"));
    await user.type(screen.getByLabelText("Ano de início"), "2024");
    await user.selectOptions(screen.getByLabelText("Mês de início"), "1");
    await user.click(screen.getByRole("checkbox", { name: /melhor informação histórica/i }));
    expect(screen.getByText(/eflow\.csv — 7 B/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Importar CSV" }));

    await waitFor(() => expect(eflowApi.importarColetaEflow).toHaveBeenCalledWith({
      arquivo: file,
      ano_vigencia_inicio: 2024,
      mes_vigencia_inicio: 1,
      vigencia_retroativa: true,
    }));
    expect(await screen.findByRole("heading", { name: "Resultado da importação" })).toBeInTheDocument();
    expect(screen.getByText("Snapshot E-Flow importado e indicadores registrados.")).toBeInTheDocument();
    expect(screen.getByText("1.016 fluxos")).toBeInTheDocument();
    expect(eflowApi.listColetasEflow).toHaveBeenCalledTimes(2);
  });

  it("não interpreta HTTP 201 com situacao FALHOU como sucesso", async () => {
    const user = userEvent.setup();
    vi.mocked(eflowApi.importarColetaEflow).mockResolvedValue({
      ...completed,
      situacao: "FALHOU",
      codigo_erro: "PATRIARCA_NAO_RECONCILIADO",
      mensagem_erro: "A sigla não identifica um patriarca.",
    });
    setup();

    await user.upload(
      await screen.findByLabelText("Arquivo CSV"),
      new File(["inválido"], "falha.csv", { type: "text/csv" }),
    );
    await user.click(screen.getByRole("button", { name: "Importar CSV" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("A sigla não identifica um patriarca.");
    expect(screen.getByText(/PATRIARCA_NAO_RECONCILIADO/)).toBeInTheDocument();
  });

  it("exibe a validação do backend e devolve o foco ao upload", async () => {
    const user = userEvent.setup();
    vi.mocked(eflowApi.importarColetaEflow).mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          arquivo: {
            codigo: "CABECALHO_INVALIDO",
            detalhe: "O cabeçalho do CSV não corresponde ao contrato.",
          },
        },
      },
    });
    setup();
    const input = await screen.findByLabelText("Arquivo CSV");
    await user.upload(
      input,
      new File(["coluna"], "invalido.csv", { type: "text/csv" }),
    );
    await user.click(screen.getByRole("button", { name: "Importar CSV" }));

    expect(
      await screen.findByText("O cabeçalho do CSV não corresponde ao contrato."),
    ).toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it("representa carregamento, vazio e erro da listagem", async () => {
    let resolveList!: (value: typeof emptyPage) => void;
    vi.mocked(eflowApi.listColetasEflow).mockReturnValue(
      new Promise((resolve) => { resolveList = resolve; }),
    );
    setup();
    expect(screen.getByText("Carregando...")).toBeInTheDocument();
    await act(async () => resolveList(emptyPage));
    expect(await screen.findByText("Nenhuma coleta E-Flow registrada.")).toBeInTheDocument();

    vi.mocked(eflowApi.listColetasEflow).mockRejectedValue(new Error("offline"));
    setup();
    expect(await screen.findByText("Não foi possível carregar as coletas E-Flow.")).toBeInTheDocument();
  });
});
