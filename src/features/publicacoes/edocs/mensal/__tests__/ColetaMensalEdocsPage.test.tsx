import { AxiosError } from "axios";
import { SWRConfig } from "swr";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ColetaMensalEdocsPage,
  monthlyCollectionRefreshInterval,
} from "@/features/publicacoes/edocs/mensal/ColetaMensalEdocsPage";
import * as monthlyApi from "@/features/publicacoes/edocs/mensal/api";
import type { ColetaMensalEdocs } from "@/features/publicacoes/edocs/mensal/model";
import { PERMISSIONS, type PermissionKey } from "@/lib/permissions";

let routeAllowed = true;
let granted = new Set<PermissionKey>();

vi.mock("@/components/common/RouteGuard", () => ({
  RouteGuard: ({ children }: { children: React.ReactNode }) =>
    routeAllowed ? children : <div>Acesso negado</div>,
}));
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    can: (permission: PermissionKey) => granted.has(permission),
  }),
}));
vi.mock("@/features/publicacoes/edocs/mensal/api", async (importOriginal) => {
  const original = await importOriginal<
    typeof import("@/features/publicacoes/edocs/mensal/api")
  >();
  return {
    ...original,
    getTotaisHistoricosEdocs: vi.fn(),
    getTotaisResultadosMensaisPatriarcasEdocs: vi.fn(),
    listColetasMensaisEdocs: vi.fn(),
    reencaminharColetaMensalEdocs: vi.fn(),
    solicitarColetaMensalEdocs: vi.fn(),
    listResultadosMensaisPatriarcasEdocs: vi.fn(),
    listResultadosMensaisOrganizacoesEdocs: vi.fn(),
    listFontesBrutasColetasMensaisEdocs: vi.fn(),
    listAuditoriaColetasMensaisEdocs: vi.fn(),
  };
});

const emptyPage = { count: 0, next: null, previous: null, results: [] };
const collection: ColetaMensalEdocs = {
  id: "11111111-1111-1111-1111-111111111111",
  ano: 2024,
  mes: 9,
  revisao: 2,
  ambiente: "PRD",
  situacao: "SUCESSO",
  iniciada_em: "2026-11-10T12:00:00Z",
  concluida_em: "2026-11-10T12:05:00Z",
  quantidade_patriarcas: 1,
  quantidade_organizacoes: 1,
  quantidade_fontes_brutas: 5,
  patriarcas_solicitados: [
    { id: 7, id_externo: "externo-7", sigla: "SEGER", nome: "Secretaria de Gestão" },
  ],
  hash_resultado: "abc123",
  codigo_erro: "",
  mensagem_erro: "",
  criado_por_id: 2,
  criado_por_nome: "Gestora",
  criado_em: "2026-11-10T11:59:00Z",
  acoes_disponiveis: [],
};

function setup() {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <ColetaMensalEdocsPage />
    </SWRConfig>,
  );
}

describe("coleta mensal E-Docs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeAllowed = true;
    granted = new Set<PermissionKey>([
      PERMISSIONS.EDOCS_MENSAL_COLETA_VIEW,
      PERMISSIONS.EDOCS_MENSAL_COLETA_SOLICITAR,
      PERMISSIONS.EDOCS_MENSAL_RESULTADO_PATRIARCA_VIEW,
      PERMISSIONS.EDOCS_MENSAL_RESULTADO_ORGANIZACAO_VIEW,
      PERMISSIONS.EDOCS_MENSAL_FONTE_BRUTA_VIEW,
      PERMISSIONS.EDOCS_MENSAL_EVENTO_AUDITORIA_VIEW,
    ]);
    vi.mocked(monthlyApi.listColetasMensaisEdocs).mockResolvedValue(emptyPage);
    vi.mocked(monthlyApi.solicitarColetaMensalEdocs).mockResolvedValue({
      ...collection,
      situacao: "SOLICITADA",
      acoes_disponiveis: ["reencaminhar"],
    });
    vi.mocked(monthlyApi.reencaminharColetaMensalEdocs).mockResolvedValue({
      ...collection,
      situacao: "SOLICITADA",
      acoes_disponiveis: ["reencaminhar"],
    });
    vi.mocked(monthlyApi.listResultadosMensaisPatriarcasEdocs).mockResolvedValue(emptyPage);
    vi.mocked(monthlyApi.listResultadosMensaisOrganizacoesEdocs).mockResolvedValue(emptyPage);
    vi.mocked(monthlyApi.listFontesBrutasColetasMensaisEdocs).mockResolvedValue(emptyPage);
    vi.mocked(monthlyApi.listAuditoriaColetasMensaisEdocs).mockResolvedValue(emptyPage);
    vi.mocked(monthlyApi.getTotaisResultadosMensaisPatriarcasEdocs).mockResolvedValue({
      coleta_id: collection.id,
      quantidade_municipios: 25,
      versao_calculo: "PLANILHA_MUNICIPIOS_V1",
      total_processos: 39946,
      total_documentos: 1585082,
      total_paginas: 4703129,
      economia_papel_kg: "22057.67501",
      gases_poluentes_kg: "16460.9515",
      economia_papel_reais: "282187.74",
      economia_insumos_reais: "47935.20",
      economia_impressao_reais: "470312.90",
      economia_total_reais: "800435.84",
      economia_agua_m3: "47031.29",
      arvores_salvas: "470.3129",
    });
    vi.mocked(monthlyApi.getTotaisHistoricosEdocs).mockResolvedValue({
      ano: null,
      patriarca_id: null,
      codigo_municipio: null,
      nome_municipio: null,
      quantidade_competencias: 18,
      quantidade_municipios: 25,
      versoes_calculo: ["PLANILHA_MUNICIPIOS_V1"],
      total_processos: 80000,
      total_documentos: 2500000,
      total_paginas: 7200000,
      economia_papel_kg: "33768.00000",
      gases_poluentes_kg: "25200.0000",
      economia_papel_reais: "432000.00",
      economia_insumos_reais: "73300.00",
      economia_impressao_reais: "720000.00",
      economia_total_reais: "1225300.00",
      economia_agua_m3: "72000.00",
      arvores_salvas: "720.0000",
    });
  });

  it("protege a rota pela permissão técnica", () => {
    routeAllowed = false;
    setup();
    expect(screen.getByText("Acesso negado")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Coleta de Dados — E-Docs" })).not.toBeInTheDocument();
  });

  it("mantém solicitação/alertas e revisões mensais em regiões independentes", async () => {
    setup();

    expect(await screen.findByTestId("monthly-request-alerts")).toBeInTheDocument();
    expect(screen.getByTestId("monthly-historical-totals")).toBeInTheDocument();
    expect(screen.getByTestId("monthly-revisions")).toBeInTheDocument();
  });

  it("consulta totais históricos pelos quatro escopos sem somar dados locais", async () => {
    const user = userEvent.setup();
    setup();

    expect(await screen.findByText("Totais históricos E-Docs")).toBeInTheDocument();
    expect(monthlyApi.getTotaisHistoricosEdocs).toHaveBeenCalledWith({});
    await user.type(screen.getByLabelText("Ano (opcional)"), "2024");
    await user.type(screen.getByLabelText("ID interno do município (opcional)"), "25");
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    await waitFor(() =>
      expect(monthlyApi.getTotaisHistoricosEdocs).toHaveBeenLastCalledWith({
        ano: 2024,
        patriarca_id: 25,
      }),
    );
  });

  it("lista, pagina e aplica os filtros contratados", async () => {
    const user = userEvent.setup();
    vi.mocked(monthlyApi.listColetasMensaisEdocs).mockResolvedValue({
      count: 21,
      next: "?page=2",
      previous: null,
      results: [collection],
    });
    setup();

    expect(await screen.findByText("09/2024")).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Ano"));
    await user.type(screen.getByLabelText("Ano"), "2024");
    await user.selectOptions(screen.getByLabelText("Mês"), "9");
    await user.selectOptions(screen.getByLabelText("Situação"), "SUCESSO");
    await user.click(screen.getByRole("button", { name: "Próxima página" }));

    await waitFor(() =>
      expect(monthlyApi.listColetasMensaisEdocs).toHaveBeenLastCalledWith(
        expect.objectContaining({
          ano: 2024,
          mes: 9,
          situacao: "SUCESSO",
          page: 2,
        }),
      ),
    );
  });

  it("solicita uma nova revisão e revalida a listagem", async () => {
    const user = userEvent.setup();
    setup();
    await user.clear(screen.getByLabelText("Ano da nova coleta"));
    await user.type(screen.getByLabelText("Ano da nova coleta"), "2024");
    await user.selectOptions(screen.getByLabelText("Mês da nova coleta"), "9");
    await user.click(screen.getByRole("button", { name: "Solicitar nova revisão" }));

    expect(monthlyApi.solicitarColetaMensalEdocs).toHaveBeenCalledWith({ ano: 2024, mes: 9 });
    expect(await screen.findByText(/solicitada como revisão 2/)).toBeInTheDocument();
    await waitFor(() => expect(monthlyApi.listColetasMensaisEdocs).toHaveBeenCalledTimes(2));
  });

  it("trata conflito 409 sem prometer publicação", async () => {
    const user = userEvent.setup();
    vi.mocked(monthlyApi.solicitarColetaMensalEdocs).mockRejectedValue(
      new AxiosError(
        "conflict",
        "ERR_BAD_RESPONSE",
        undefined,
        undefined,
        { status: 409, statusText: "Conflict", headers: {}, config: {} as never, data: {} },
      ),
    );
    setup();
    await user.click(await screen.findByRole("button", { name: "Solicitar nova revisão" }));

    expect(await screen.findByText(/Já existe uma coleta ativa/)).toBeInTheDocument();
    expect(screen.getByText(/não aprova nem publica dados/i)).toBeInTheDocument();
  });

  it("oculta a solicitação sem permissão", async () => {
    granted = new Set<PermissionKey>([PERMISSIONS.EDOCS_MENSAL_COLETA_VIEW]);
    setup();
    expect(await screen.findByText("Nenhuma coleta mensal E-Docs registrada.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Solicitar nova revisão" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("monthly-historical-totals")).not.toBeInTheDocument();
  });

  it("renderiza os quatro estados novos e descreve SOLICITADA sem aparência de erro", async () => {
    const user = userEvent.setup();
    vi.mocked(monthlyApi.listColetasMensaisEdocs).mockResolvedValue({
      count: 4,
      next: null,
      previous: null,
      results: [
        { ...collection, id: "solicitada", situacao: "SOLICITADA" },
        { ...collection, id: "executando", situacao: "EXECUTANDO" },
        { ...collection, id: "sucesso", situacao: "SUCESSO" },
        { ...collection, id: "erro", situacao: "ERRO" },
      ],
    });
    setup();

    expect((await screen.findAllByText("Solicitada")).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Executando").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Sucesso").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Erro").length).toBeGreaterThanOrEqual(1);
    await user.click(screen.getAllByRole("button", { name: "Visualizar" })[0]);
    expect(screen.getByText(/execução ainda não começou/i)).toBeInTheDocument();
    expect(screen.queryByText(/COLETA_COM_ERRO/)).not.toBeInTheDocument();
  });

  it("reencaminha somente pela ação autoritativa e revalida os caches", async () => {
    const user = userEvent.setup();
    vi.mocked(monthlyApi.listColetasMensaisEdocs).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [{
        ...collection,
        situacao: "SOLICITADA",
        acoes_disponiveis: ["reencaminhar"],
      }],
    });
    setup();

    await user.click(await screen.findByRole("button", { name: "Reencaminhar solicitação" }));
    expect(monthlyApi.reencaminharColetaMensalEdocs).toHaveBeenCalledWith(collection.id);
    expect(await screen.findByText(/foi reencaminhada sem criar uma nova revisão/i)).toBeInTheDocument();
    await waitFor(() => expect(monthlyApi.listColetasMensaisEdocs).toHaveBeenCalledTimes(2));
  });

  it("não oferece reencaminhamento sem a ação ou sem a permissão técnica", async () => {
    vi.mocked(monthlyApi.listColetasMensaisEdocs).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [{ ...collection, situacao: "SOLICITADA", acoes_disponiveis: [] }],
    });
    const first = setup();
    expect(await screen.findByText("Solicitada")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reencaminhar solicitação" })).not.toBeInTheDocument();
    first.unmount();

    granted.delete(PERMISSIONS.EDOCS_MENSAL_COLETA_SOLICITAR);
    vi.mocked(monthlyApi.listColetasMensaisEdocs).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [{
        ...collection,
        situacao: "SOLICITADA",
        acoes_disponiveis: ["reencaminhar"],
      }],
    });
    setup();
    expect(await screen.findByText("Solicitada")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reencaminhar solicitação" })).not.toBeInTheDocument();
  });

  it("representa carregamento, vazio e erro", async () => {
    let resolveList!: (value: typeof emptyPage) => void;
    vi.mocked(monthlyApi.listColetasMensaisEdocs).mockReturnValue(
      new Promise((resolve) => { resolveList = resolve; }),
    );
    setup();
    expect(screen.getByText("Carregando...")).toBeInTheDocument();
    await act(async () => resolveList(emptyPage));
    expect(await screen.findByText("Nenhuma coleta mensal E-Docs registrada.")).toBeInTheDocument();

    vi.mocked(monthlyApi.listColetasMensaisEdocs).mockRejectedValue(new Error("offline"));
    setup();
    expect(await screen.findByText("Não foi possível carregar as coletas mensais E-Docs.")).toBeInTheDocument();
  });

  it("mostra erro persistido sem erro HTTP, abas e preserva métricas nulas", async () => {
    const user = userEvent.setup();
    vi.mocked(monthlyApi.listColetasMensaisEdocs).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [{ ...collection, situacao: "ERRO", codigo_erro: "ORIGEM_INDISPONIVEL", mensagem_erro: "A origem não respondeu." }],
    });
    vi.mocked(monthlyApi.listResultadosMensaisPatriarcasEdocs).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [{
        id: 1,
        coleta_id: collection.id,
        patriarca_id: 7,
        id_patriarca_externo: "externo-7",
        sigla_patriarca: "SEGER",
        nome_patriarca: "Secretaria de Gestão",
        codigo_municipio: null,
        total_processos: null,
        total_documentos: 0,
        total_paginas: null,
        versao_calculo: "PLANILHA_MUNICIPIOS_V1",
        economia_papel_kg: "0.00000",
        gases_poluentes_kg: "0.0000",
        economia_papel_reais: "0.00",
        economia_insumos_reais: "0.00",
        economia_impressao_reais: "0.00",
        economia_total_reais: "0.00",
        economia_agua_m3: "0.00",
        arvores_salvas: "0.0000",
      }],
    });
    setup();
    await user.click(await screen.findByRole("button", { name: "Visualizar" }));

    expect(screen.getByText(/ORIGEM_INDISPONIVEL/)).toBeInTheDocument();
    expect(screen.getByText("SEGER")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Municípios" }));
    expect((await screen.findAllByText("Não informado pela origem")).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("tab", { name: "Organizações" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Fontes" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Auditoria" })).toBeInTheDocument();
  });

  it("exibe o consolidado canônico e os indicadores por município sem recalcular a página", async () => {
    const user = userEvent.setup();
    vi.mocked(monthlyApi.listColetasMensaisEdocs).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [collection],
    });
    vi.mocked(monthlyApi.listResultadosMensaisPatriarcasEdocs).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [{
        id: 1,
        coleta_id: collection.id,
        patriarca_id: 7,
        id_patriarca_externo: "externo-7",
        sigla_patriarca: "SEGER",
        nome_patriarca: "Secretaria de Gestão",
        codigo_municipio: 3201100,
        total_processos: 12,
        total_documentos: 25,
        total_paginas: 71,
        versao_calculo: "PLANILHA_MUNICIPIOS_V1",
        economia_papel_kg: "0.33299",
        gases_poluentes_kg: "0.2485",
        economia_papel_reais: "4.26",
        economia_insumos_reais: "14.40",
        economia_impressao_reais: "7.10",
        economia_total_reais: "25.76",
        economia_agua_m3: "0.71",
        arvores_salvas: "0.0071",
      }],
    });
    setup();

    await user.click(await screen.findByRole("button", { name: "Visualizar" }));
    expect(await screen.findByText("Consolidado de todos os municípios")).toBeInTheDocument();
    expect(screen.getByText(/800\.435,84/)).toBeInTheDocument();
    expect(screen.getByText("1.585.082")).toBeInTheDocument();
    expect(monthlyApi.getTotaisResultadosMensaisPatriarcasEdocs).toHaveBeenCalledWith(collection.id);

    await user.click(screen.getByRole("tab", { name: "Municípios" }));
    expect(await screen.findByText(/25,76/)).toBeInTheDocument();
    expect(screen.getByText("0,33299 kg")).toBeInTheDocument();
  });

  it("interrompe o polling nos estados terminais", () => {
    expect(monthlyCollectionRefreshInterval({
      results: [{ ...collection, situacao: "EXECUTANDO" }],
    })).toBe(5_000);
    expect(monthlyCollectionRefreshInterval({
      results: [{ ...collection, situacao: "SUCESSO" }],
    })).toBe(0);
    expect(monthlyCollectionRefreshInterval({
      results: [{ ...collection, situacao: "ERRO" }],
    })).toBe(0);
  });

  it("apresenta o evento de auditoria REENCAMINHADA com rótulo seguro", async () => {
    const user = userEvent.setup();
    vi.mocked(monthlyApi.listColetasMensaisEdocs).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [collection],
    });
    vi.mocked(monthlyApi.listAuditoriaColetasMensaisEdocs).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [{
        id: 1,
        coleta_id: collection.id,
        tipo_evento: "REENCAMINHADA",
        mensagem: "Solicitação entregue novamente à fila.",
        metadados: {},
        criado_por_id: 2,
        criado_por_nome: "Gestora",
        criado_em: "2026-11-10T12:01:00Z",
      }],
    });
    setup();
    await user.click(await screen.findByRole("button", { name: "Visualizar" }));
    await user.click(screen.getByRole("tab", { name: "Auditoria" }));
    expect(await screen.findByText("Solicitação reencaminhada")).toBeInTheDocument();
  });
});
