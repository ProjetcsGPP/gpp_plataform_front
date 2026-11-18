import { SWRConfig } from "swr";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MunicipiosEdocsPanel } from "@/features/publicacoes/edocs/municipios/MunicipiosEdocsPanel";
import * as edocsApi from "@/features/publicacoes/edocs/api";
import type { MunicipioEdocs } from "@/features/publicacoes/edocs/model";
import { PERMISSIONS, type PermissionKey } from "@/lib/permissions";

let granted = new Set<PermissionKey>();
vi.mock("@/hooks/usePermissions", () => ({ usePermissions: () => ({ can: (permission: PermissionKey) => granted.has(permission) }) }));
vi.mock("@/features/publicacoes/edocs/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/publicacoes/edocs/api")>();
  return { ...original, listMunicipiosIbge: vi.fn(), listMunicipiosEdocs: vi.fn(), cadastrarMunicipioEdocs: vi.fn(), alterarSituacaoMunicipioEdocs: vi.fn(), corrigirCadastroMunicipioEdocs: vi.fn(), listAuditoriaMunicipiosEdocs: vi.fn() };
});

const municipality: MunicipioEdocs = {
  id: 25, codigo_ibge: 3201100, nome: "Bom Jesus do Norte", ativo: true, versao: 2,
  situacao_atual: { id: 3, situacao: "MANIFESTOU_INTERESSE", ano_inicio: 2024, mes_inicio: 6, competencia_inicio: "2024-06", ano_fim: null, mes_fim: null, competencia_fim: null, criado_em: "2026-11-10T10:00:00Z" },
  vigencias: [], patriarca_edocs: null, criado_em: "2026-11-10T10:00:00Z", atualizado_em: "2026-11-10T11:00:00Z",
  acoes_disponiveis: ["corrigir_cadastro", "alterar_situacao"],
};

function setup(current = municipality) {
  vi.mocked(edocsApi.listMunicipiosEdocs).mockResolvedValue({ count: 1, next: null, previous: null, results: [current] });
  vi.mocked(edocsApi.listMunicipiosIbge).mockResolvedValue([
    { nome: "Cachoeiro de Itapemirim", codigo_ibge: 3201209 },
  ]);
  vi.mocked(edocsApi.cadastrarMunicipioEdocs).mockResolvedValue(current);
  vi.mocked(edocsApi.alterarSituacaoMunicipioEdocs).mockResolvedValue(current);
  return render(<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}><MunicipiosEdocsPanel /></SWRConfig>);
}

async function fillCreation(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: "Cadastrar município" }));
  await user.selectOptions(await screen.findByLabelText("Município"), "3201209");
  await user.selectOptions(screen.getByLabelText("Situação inicial"), "EM_IMPLANTACAO");
  await user.type(screen.getByLabelText("Ano inicial"), "2024");
  await user.selectOptions(screen.getByLabelText("Mês inicial"), "7");
  await user.type(screen.getByLabelText("Justificativa"), "Situação confirmada pelo município.");
}

describe("cadastro municipal E-Docs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    granted = new Set<PermissionKey>([PERMISSIONS.EDOCS_MUNICIPIO_VIEW, PERMISSIONS.EDOCS_MUNICIPIO_ADD, PERMISSIONS.EDOCS_MUNICIPIO_CHANGE, PERMISSIONS.EDOCS_MUNICIPIO_SITUACAO_ALTERAR]);
  });

  it("exibe município sem patriarca sem fabricar UUID externo", async () => {
    setup();
    expect(await screen.findByText("Ainda não associado")).toBeInTheDocument();
    expect(screen.queryByText(/id_externo/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/00000000-0000/)).not.toBeInTheDocument();
  });

  it("exibe a associação oficial posterior recebida pelo código IBGE", async () => {
    setup({ ...municipality, patriarca_edocs: { id: 10, id_externo: "uuid-oficial", sigla: "PMBJN", nome: "MUNICÍPIO DE BOM JESUS DO NORTE" } });
    expect(await screen.findByText("PMBJN")).toBeInTheDocument();
    expect(screen.getByText("MUNICÍPIO DE BOM JESUS DO NORTE")).toBeInTheDocument();
    expect(screen.queryByText("uuid-oficial")).not.toBeInTheDocument();
  });

  it("não exige digitação de código ou nome e cria a partir do catálogo do backend", async () => {
    const user = userEvent.setup(); setup();
    await user.click(await screen.findByRole("button", { name: "Cadastrar município" }));
    expect(screen.queryByLabelText("Código IBGE")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Nome do município")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
    await user.selectOptions(await screen.findByLabelText("Município"), "3201209");
    await user.selectOptions(screen.getByLabelText("Situação inicial"), "EM_IMPLANTACAO");
    await user.type(screen.getByLabelText("Ano inicial"), "2024");
    await user.selectOptions(screen.getByLabelText("Mês inicial"), "7");
    await user.type(screen.getByLabelText("Justificativa"), "Situação confirmada pelo município.");
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(edocsApi.cadastrarMunicipioEdocs).toHaveBeenCalledWith({ codigo_ibge: 3201209, nome: "Cachoeiro de Itapemirim", situacao: "EM_IMPLANTACAO", ano_inicio: 2024, mes_inicio: 7, justificativa: "Situação confirmada pelo município." }));
  });

  it("mantém o município atual visível ao oferecer somente alternativas ainda não cadastradas", async () => {
    const user = userEvent.setup(); setup();
    await user.click(await screen.findByRole("button", { name: "Corrigir" }));
    const field = await screen.findByLabelText("Município");
    expect(field).toHaveValue("3201100");
    expect(screen.getByRole("option", { name: "Bom Jesus do Norte — 3201100" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Cachoeiro de Itapemirim — 3201209" })).toBeInTheDocument();
  });

  it("revalida e apresenta a mensagem do backend em código duplicado", async () => {
    const user = userEvent.setup(); setup();
    vi.mocked(edocsApi.cadastrarMunicipioEdocs).mockRejectedValue({ isAxiosError: true, response: { status: 409, data: { detail: "O código IBGE já está cadastrado." } } });
    await fillCreation(user);
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("O código IBGE já está cadastrado.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Cadastrar município" })).not.toBeInTheDocument();
  });

  it("impede transição na mesma competência e envia a versão na posterior", async () => {
    const user = userEvent.setup(); setup();
    await user.click(await screen.findByRole("button", { name: "Nova situação" }));
    await user.selectOptions(screen.getByLabelText("Nova situação"), "EM_IMPLANTACAO");
    await user.type(screen.getByLabelText("Ano inicial"), "2024");
    await user.selectOptions(screen.getByLabelText("Mês inicial"), "6");
    expect(screen.getByText("A competência deve ser posterior à situação vigente.")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Mês inicial"), "7");
    await user.type(screen.getByLabelText("Justificativa"), "Implantação iniciada.");
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(edocsApi.alterarSituacaoMunicipioEdocs).toHaveBeenCalledWith(25, { situacao: "EM_IMPLANTACAO", ano_inicio: 2024, mes_inicio: 7, versao: 2, justificativa: "Implantação iniciada." }));
  });

  it("revalida e apresenta conflito de versão devolvido pelo backend", async () => {
    const user = userEvent.setup(); setup();
    vi.mocked(edocsApi.alterarSituacaoMunicipioEdocs).mockRejectedValue({ isAxiosError: true, response: { status: 409, data: { detail: "O cadastro foi alterado por outro usuário. Atualize a consulta." } } });
    await user.click(await screen.findByRole("button", { name: "Nova situação" }));
    await user.type(screen.getByLabelText("Ano inicial"), "2024");
    await user.selectOptions(screen.getByLabelText("Mês inicial"), "7");
    await user.type(screen.getByLabelText("Justificativa"), "Implantação iniciada.");
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText(/alterado por outro usuário/)).toBeInTheDocument();
  });

  it("exibe histórico de vigências sem combinar situações booleanas", async () => {
    const user = userEvent.setup();
    setup({ ...municipality, vigencias: [
      { ...municipality.situacao_atual!, id: 1, situacao: "MANIFESTOU_INTERESSE", competencia_inicio: "2024-01", ano_inicio: 2024, mes_inicio: 1, competencia_fim: "2024-05", ano_fim: 2024, mes_fim: 5 },
      municipality.situacao_atual!,
    ] });
    await user.click(await screen.findByRole("button", { name: "Vigências" }));
    expect(screen.getByText("2024-05")).toBeInTheDocument();
    expect(screen.getByText("Vigente")).toBeInTheDocument();
  });

  it("consulta auditoria com valores, justificativa, usuário e data", async () => {
    granted.add(PERMISSIONS.EDOCS_MUNICIPIO_AUDITORIA_VIEW);
    vi.mocked(edocsApi.listAuditoriaMunicipiosEdocs).mockResolvedValue({ count: 1, next: null, previous: null, results: [{ id: 9, municipio_id: 25, municipio_codigo_ibge: 3201100, municipio_nome: "Bom Jesus do Norte", tipo_evento: "SITUACAO_ALTERADA", mensagem: "Situação municipal do E-Docs alterada.", dados_anteriores: { situacao: "SEM_DADOS" }, dados_atuais: { situacao: "MANIFESTOU_INTERESSE" }, metadados: { justificativa: "Interesse formalizado." }, criado_por_id: 2, criado_por_nome: "Gestor", criado_em: "2026-11-12T10:00:00Z" }] });
    const user = userEvent.setup(); setup();
    await user.click(await screen.findByRole("button", { name: "Auditoria" }));
    await user.click(await screen.findByText("SITUACAO_ALTERADA"));
    expect(screen.getByText(/Interesse formalizado/)).toBeInTheDocument();
    expect(screen.getByText("Responsável: Gestor")).toBeInTheDocument();
  });

  it("não oferece mutações sem permissão e ação técnica simultâneas", async () => {
    granted = new Set<PermissionKey>([PERMISSIONS.EDOCS_MUNICIPIO_VIEW]);
    setup({ ...municipality, acoes_disponiveis: [] });
    expect(await screen.findByText("Bom Jesus do Norte")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cadastrar município" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Corrigir" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Nova situação" })).not.toBeInTheDocument();
  });
});
