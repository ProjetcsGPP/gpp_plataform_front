import { AxiosError } from "axios";
import { SWRConfig } from "swr";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ColetaMensalEdocsPage } from "@/features/publicacoes/edocs/mensal/ColetaMensalEdocsPage";
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
    listColetasMensaisEdocs: vi.fn(),
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
  situacao: "CONCLUIDA",
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
      situacao: "AGENDADA",
    });
    vi.mocked(monthlyApi.listResultadosMensaisPatriarcasEdocs).mockResolvedValue(emptyPage);
    vi.mocked(monthlyApi.listResultadosMensaisOrganizacoesEdocs).mockResolvedValue(emptyPage);
    vi.mocked(monthlyApi.listFontesBrutasColetasMensaisEdocs).mockResolvedValue(emptyPage);
    vi.mocked(monthlyApi.listAuditoriaColetasMensaisEdocs).mockResolvedValue(emptyPage);
  });

  it("protege a rota pela permissão técnica", () => {
    routeAllowed = false;
    setup();
    expect(screen.getByText("Acesso negado")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Coleta de Dados — E-Docs" })).not.toBeInTheDocument();
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
    await user.selectOptions(screen.getByLabelText("Situação"), "CONCLUIDA");
    await user.click(screen.getByRole("button", { name: "Próxima página" }));

    await waitFor(() =>
      expect(monthlyApi.listColetasMensaisEdocs).toHaveBeenLastCalledWith(
        expect.objectContaining({
          ano: 2024,
          mes: 9,
          situacao: "CONCLUIDA",
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
    expect(await screen.findByText(/agendada como revisão 2/)).toBeInTheDocument();
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

  it("mostra falha persistida, abas e preserva métricas nulas", async () => {
    const user = userEvent.setup();
    vi.mocked(monthlyApi.listColetasMensaisEdocs).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [{ ...collection, situacao: "FALHOU", codigo_erro: "ORIGEM_INDISPONIVEL", mensagem_erro: "A origem não respondeu." }],
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
      }],
    });
    setup();
    await user.click(await screen.findByRole("button", { name: "Visualizar" }));

    expect(screen.getByText(/ORIGEM_INDISPONIVEL/)).toBeInTheDocument();
    expect(screen.getByText("SEGER")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Patriarcas" }));
    expect((await screen.findAllByText("Não informado pela origem")).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Organizações" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Fontes" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Auditoria" })).toBeInTheDocument();
  });
});
