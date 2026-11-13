import { SWRConfig } from "swr";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PatriarcasEdocsPage } from "@/features/publicacoes/edocs/PatriarcasEdocsPage";
import * as edocsApi from "@/features/publicacoes/edocs/api";
import type { PatriarcaEdocs } from "@/features/publicacoes/edocs/model";
import { PERMISSIONS, type PermissionKey } from "@/lib/permissions";

let granted = new Set<PermissionKey>();

vi.mock("@/components/common/RouteGuard", () => ({ RouteGuard: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/hooks/usePermissions", () => ({ usePermissions: () => ({ can: (permission: PermissionKey) => granted.has(permission) }) }));
vi.mock("@/features/publicacoes/edocs/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/publicacoes/edocs/api")>();
  return { ...original, listPatriarcasEdocs: vi.fn(), listMunicipiosEdocs: vi.fn() };
});

const patriarch: PatriarcaEdocs = {
  id: 7, id_externo: "externo-7", sigla: "SEGER", nome: "Secretaria de Gestão",
  tipo_agente: 1, descricao_tipo_agente: "Secretaria", coletar_detalhes: true,
  ativo: true, versao: 1, criado_em: "2026-11-10T10:00:00Z", atualizado_em: "2026-11-10T11:00:00Z",
  codigo_municipio: 3201100, municipio_implantado: false, municipio_em_implantacao: true,
  municipio_manifestou_interesse: false, municipio_implantado_sem_uso_edocs: false,
  ano_inicio_implantacao_sem_uso_edocs: null, mes_inicio_implantacao_sem_uso_edocs: null,
  implantacao_edocs_observada: null, acoes_disponiveis: ["alterar_indicadores_municipais"],
};

function setup(current = patriarch) {
  vi.mocked(edocsApi.listPatriarcasEdocs).mockResolvedValue({ count: 1, next: null, previous: null, results: [current] });
  vi.mocked(edocsApi.listMunicipiosEdocs).mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
  return render(<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}><PatriarcasEdocsPage /></SWRConfig>);
}

describe("catálogo E-Docs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    granted = new Set<PermissionKey>([PERMISSIONS.EDOCS_PATRIARCA_VIEW, PERMISSIONS.EDOCS_MUNICIPIO_VIEW]);
  });

  it("mantém os indicadores antigos apenas como evidência legada de leitura", async () => {
    setup();
    expect(await screen.findByText(/Indicadores legados \(somente leitura\): Município em implantação/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Indicadores" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Uso E-Docs" })).not.toBeInTheDocument();
  });

  it("oferece a visão municipal separada na mesma área", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("tab", { name: "Municípios" }));
    expect(await screen.findByRole("heading", { name: "Cadastro municipal E-Docs" })).toBeInTheDocument();
    expect(screen.getByText(/Cadastro independente de municípios/)).toBeInTheDocument();
  });

  it("distingue ausência de implantação observada de evidência positiva", async () => {
    const user = userEvent.setup();
    const evidence = { ...patriarch, implantacao_edocs_observada: { ano: 2024, mes: 6, competencia: "2024-06", coleta_evidencia_id: "11111111-1111-1111-1111-111111111111", criterio: "ATIVIDADE_API", totais_evidencia: { total_processos: 1 }, criado_em: "2026-11-11T10:00:00Z" } };
    setup(evidence);
    await user.click(await screen.findByRole("button", { name: "2024-06" }));
    expect(screen.getByText(/Resultado zerado não é interpretado/)).toBeInTheDocument();
  });
});
