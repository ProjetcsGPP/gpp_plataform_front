import { SWRConfig } from "swr";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PatriarcasEdocsPage } from "@/features/publicacoes/edocs/PatriarcasEdocsPage";
import * as edocsApi from "@/features/publicacoes/edocs/api";
import type { PatriarcaEdocs } from "@/features/publicacoes/edocs/model";
import { PERMISSIONS, type PermissionKey } from "@/lib/permissions";

let granted = new Set<PermissionKey>();

vi.mock("@/components/common/RouteGuard", () => ({
  RouteGuard: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    can: (permission: PermissionKey) => granted.has(permission),
  }),
}));
vi.mock("@/features/publicacoes/edocs/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/publicacoes/edocs/api")>();
  return {
    ...original,
    listPatriarcasEdocs: vi.fn(),
    alterarSelecaoColetaEdocs: vi.fn(),
    alterarIndicadoresMunicipaisEdocs: vi.fn(),
  };
});

const patriarch: PatriarcaEdocs = {
  id: 7,
  id_externo: "externo-7",
  sigla: "SEGER",
  nome: "Secretaria de Gestão",
  tipo_agente: 1,
  descricao_tipo_agente: "Secretaria",
  coletar_detalhes: true,
  ativo: true,
  versao: 1,
  criado_em: "2026-11-10T10:00:00Z",
  atualizado_em: "2026-11-10T11:00:00Z",
  codigo_municipio: null,
  municipio_implantado: false,
  municipio_em_implantacao: false,
  municipio_manifestou_interesse: false,
  municipio_implantado_sem_uso_edocs: false,
  implantacao_edocs_observada: null,
  acoes_disponiveis: ["alterar_indicadores_municipais"],
};

function setup(current = patriarch) {
  vi.mocked(edocsApi.listPatriarcasEdocs).mockResolvedValue({
    count: 1,
    next: null,
    previous: null,
    results: [current],
  });
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <PatriarcasEdocsPage />
    </SWRConfig>,
  );
}

describe("indicadores municipais dos patriarcas E-Docs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    granted = new Set<PermissionKey>([
      PERMISSIONS.EDOCS_PATRIARCA_VIEW,
      PERMISSIONS.EDOCS_INDICADORES_MUNICIPAIS_ALTERAR,
    ]);
    vi.mocked(edocsApi.alterarIndicadoresMunicipaisEdocs).mockResolvedValue(patriarch);
  });

  it("preserva código nulo e envia somente os campos alterados", async () => {
    const user = userEvent.setup();
    setup();

    expect(await screen.findByText("Não informado")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Indicadores" }));
    await user.type(screen.getByLabelText("Código do município"), "3201100");
    await user.click(screen.getByLabelText("Município implantado"));
    await user.type(
      screen.getByLabelText("Justificativa"),
      "Situação confirmada pelo gestor.",
    );
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() =>
      expect(edocsApi.alterarIndicadoresMunicipaisEdocs).toHaveBeenCalledWith(
        7,
        {
          codigo_municipio: 3201100,
          municipio_implantado: true,
          justificativa: "Situação confirmada pelo gestor.",
        },
      ),
    );
  });

  it("exibe código preenchido e não oferece ação sem autorização do recurso", async () => {
    setup({
      ...patriarch,
      codigo_municipio: 3201100,
      acoes_disponiveis: [],
    });

    expect(await screen.findByText("3201100")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Indicadores" })).not.toBeInTheDocument();
  });

  it("distingue implantação não observada da evidência positiva preenchida", async () => {
    const user = userEvent.setup();
    setup();
    expect(await screen.findByText("Não observada")).toBeInTheDocument();

    setup({
      ...patriarch,
      implantacao_edocs_observada: {
        ano: 2024,
        mes: 6,
        competencia: "2024-06",
        coleta_evidencia_id: "11111111-1111-1111-1111-111111111111",
        criterio: "ATIVIDADE_API",
        totais_evidencia: { total_processos: 1 },
        criado_em: "2026-11-11T10:00:00Z",
      },
    });
    await user.click(await screen.findByRole("button", { name: "2024-06" }));
    expect(screen.getByText(/Resultado zerado não é interpretado/)).toBeInTheDocument();
    expect(screen.getByText("ATIVIDADE_API")).toBeInTheDocument();
  });
});
