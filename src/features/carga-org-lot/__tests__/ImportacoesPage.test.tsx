import { SWRConfig } from "swr";
import axios from "axios";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ImportacoesPage } from "@/features/carga-org-lot/ImportacoesPage";
import * as cargaApi from "@/features/carga-org-lot/api";

vi.mock("@/components/common/RouteGuard", () => ({ RouteGuard: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/hooks/usePermissions", () => ({ usePermissions: () => ({ can: () => true }) }));
vi.mock("@/features/carga-org-lot/usePatriarcaSelection", () => ({
  usePatriarcaSelection: () => ({
    selected: { idpatriarca: 1, strsiglapatriarca: "PMBG", strnome: "Prefeitura" },
  }),
}));
vi.mock("@/features/carga-org-lot/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/carga-org-lot/api")>();
  return { ...original, listImportacoes: vi.fn(), listItensOrganograma: vi.fn(), uploadImportacao: vi.fn(), downloadArquivo: vi.fn(), deleteImportacao: vi.fn(), getValidationReport: vi.fn(), getSheetSelectionReport: vi.fn() };
});

const empty = { count: 0, next: null, previous: null, results: [] };
const organograma = {
  idimportacaoplanilha: 7,
  idpatriarca_id: 1,
  patriarca: {} as never,
  idtipocarga_id: 3,
  tipo_carga: { idtipocarga: 3, strdescricao: "Organograma" },
  idimportacaoorganograma_id: null,
  idstatusprogresso_id: 1,
  status: null,
  strnomearquivo: "organograma.xlsx",
  strtipomime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  inttamanhoarquivo: 100,
  strhasharquivo: "hash",
  strabaimportada: "Organograma",
  datimportacao: "2026-10-01T12:00:00Z",
  download_url: "/download/7/",
  total_itens_organograma: 2,
};
const organogramas = { count: 1, next: null, previous: null, results: [organograma] };

function setup(tipoCarga: 3 | 4) {
  return render(<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}><ImportacoesPage tipoCarga={tipoCarga} /></SWRConfig>);
}

describe("telas de importação", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cargaApi.listImportacoes).mockResolvedValue(empty);
    vi.mocked(cargaApi.listItensOrganograma).mockResolvedValue([]);
    vi.mocked(cargaApi.uploadImportacao).mockResolvedValue({} as never);
    vi.mocked(cargaApi.getValidationReport).mockReturnValue(null);
    vi.mocked(cargaApi.getSheetSelectionReport).mockReturnValue(null);
    vi.mocked(cargaApi.deleteImportacao).mockResolvedValue(undefined);
  });

  it("mostra loading e estado vazio depois da seleção do patriarca", async () => {
    let resolveList!: (value: typeof empty) => void;
    vi.mocked(cargaApi.listImportacoes).mockReturnValue(new Promise((resolve) => { resolveList = resolve; }));
    setup(3);
    expect(screen.getByText("Carregando arquivos...")).toBeInTheDocument();
    resolveList(empty);
    expect(await screen.findByText("Nenhum arquivo enviado para este patriarca.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Baixar versão mais recente" })).not.toBeInTheDocument();
  });

  it("mostra o download mais recente somente quando existe organograma", async () => {
    vi.mocked(cargaApi.listImportacoes).mockResolvedValue(organogramas);
    setup(3);
    expect(await screen.findByRole("button", { name: "Baixar versão mais recente" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Visualizar organograma" }));
    expect(await screen.findByRole("region", { name: "Organograma lido" })).toBeInTheDocument();
    expect(screen.queryByText("Arquivos armazenados")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Voltar à lista de arquivos" }));
    expect(await screen.findByText("Arquivos armazenados")).toBeInTheDocument();
    expect(cargaApi.listItensOrganograma).toHaveBeenCalledWith(7);
  });

  it("exige uma versão e envia a lotação vinculada ao organograma", async () => {
    vi.mocked(cargaApi.listImportacoes).mockImplementation(async (_patriarca, tipo) => tipo === 3 ? organogramas : empty);
    setup(4);
    expect(await screen.findByRole("option", { name: /organograma.xlsx/ })).toBeInTheDocument();
    const file = new File(["dados"], "lotacao.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    await userEvent.upload(screen.getByLabelText("Arquivo"), file);
    expect(screen.getByRole("button", { name: "Enviar arquivo" })).toBeDisabled();
    await userEvent.selectOptions(screen.getByLabelText("Versão do organograma"), "7");
    await userEvent.click(screen.getByRole("button", { name: "Enviar arquivo" }));
    await waitFor(() => expect(cargaApi.uploadImportacao).toHaveBeenCalledWith(1, 4, file, expect.objectContaining({ organogramaId: 7, aba: undefined })));
    expect(await screen.findByText("Lotação importada com sucesso.")).toBeInTheDocument();
  });

  it("envia lotações em pacote como tipo 5 sem campo aba", async () => {
    vi.mocked(cargaApi.listImportacoes).mockImplementation(async (_patriarca, tipo) => tipo === 3 ? organogramas : empty);
    setup(4);
    await screen.findByRole("option", { name: /organograma.xlsx/ });
    await userEvent.selectOptions(screen.getByLabelText("Tipo de carga"), "5");
    await userEvent.selectOptions(screen.getByLabelText("Versão do organograma"), "7");
    const file = new File(["dados"], "pacote.xlsx");
    await userEvent.upload(screen.getByLabelText("Arquivo"), file);
    await userEvent.click(screen.getByRole("button", { name: "Enviar arquivo" }));
    await waitFor(() => expect(cargaApi.uploadImportacao).toHaveBeenCalledWith(1, 5, file, expect.objectContaining({ organogramaId: 7, aba: undefined })));
  });

  it("preserva o arquivo no 409 e reenvia com a aba escolhida", async () => {
    const selection = { codigo: "selecao_aba_obrigatoria" as const, mensagem: "Selecione a aba.", abas: [{ nome: "Organograma", ordem: 1, linhas_preenchidas: 177 }, { nome: "Observações", ordem: 2, linhas_preenchidas: 12 }] };
    vi.mocked(cargaApi.uploadImportacao).mockRejectedValueOnce(new Error("409")).mockResolvedValueOnce({} as never);
    vi.mocked(cargaApi.getSheetSelectionReport).mockReturnValueOnce(selection).mockReturnValue(null);
    setup(3);
    const file = new File(["dados"], "organograma.xlsx");
    await userEvent.upload(screen.getByLabelText("Arquivo"), file);
    await userEvent.click(screen.getByRole("button", { name: "Enviar arquivo" }));
    expect(await screen.findByRole("dialog", { name: "Selecione a aba do organograma" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: /Observações/ }));
    await userEvent.click(screen.getByRole("button", { name: "Importar aba selecionada" }));
    await waitFor(() => expect(cargaApi.uploadImportacao).toHaveBeenLastCalledWith(1, 3, file, expect.objectContaining({ aba: "Observações" })));
    expect(cargaApi.uploadImportacao).toHaveBeenCalledTimes(2);
  });

  it("cancela a seleção de aba sem descartar o arquivo", async () => {
    vi.mocked(cargaApi.uploadImportacao).mockRejectedValueOnce(new Error("409"));
    vi.mocked(cargaApi.getSheetSelectionReport).mockReturnValueOnce({ codigo: "selecao_aba_obrigatoria", mensagem: "Selecione.", abas: [{ nome: "Org", ordem: 1, linhas_preenchidas: 2 }] });
    setup(3);
    const file = new File(["dados"], "organograma.xlsx");
    await userEvent.upload(screen.getByLabelText("Arquivo"), file);
    await userEvent.click(screen.getByRole("button", { name: "Enviar arquivo" }));
    await userEvent.click(await screen.findByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText(/Selecionado: organograma.xlsx/)).toBeInTheDocument();
  });

  it("confirma e exclui definitivamente uma importação", async () => {
    vi.mocked(cargaApi.listImportacoes).mockResolvedValue(organogramas);
    setup(3);
    await userEvent.click(await screen.findByRole("button", { name: "Excluir" }));
    expect(screen.getByText(/não pode ser desfeita/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Excluir definitivamente" }));
    await waitFor(() => expect(cargaApi.deleteImportacao).toHaveBeenCalledWith(7));
  });

  it("mantém a lista e exibe a mensagem quando a exclusão está bloqueada", async () => {
    vi.mocked(cargaApi.listImportacoes).mockResolvedValue(organogramas);
    vi.mocked(cargaApi.deleteImportacao).mockRejectedValue(new axios.AxiosError("bad", "ERR_BAD_REQUEST", undefined, undefined, { status: 400, data: { errors: ["O registro não pode ser excluído porque está em uso."] } } as never));
    setup(3);
    await userEvent.click(await screen.findByRole("button", { name: "Excluir" }));
    await userEvent.click(screen.getByRole("button", { name: "Excluir definitivamente" }));
    expect(await screen.findByText("O registro não pode ser excluído porque está em uso.")).toBeInTheDocument();
    expect(screen.getByText("organograma.xlsx")).toBeInTheDocument();
  });

  it("abre o relatório estruturado quando o backend rejeita o organograma", async () => {
    const validation = { codigo: "planilha_invalida", mensagem: "Planilha com erros", leitura_completa: false, total_abas_lidas: 0, total_linhas_lidas: 0, total_erros: 1, erros: [{ codigo: "arquivo_ilegivel", mensagem: "Falha ao abrir" }] };
    vi.mocked(cargaApi.uploadImportacao).mockRejectedValue(new Error("400"));
    vi.mocked(cargaApi.getValidationReport).mockReturnValue(validation);
    setup(3);
    fireEvent.change(screen.getByLabelText("Arquivo"), { target: { files: [new File(["x"], "org.xlsx")] } });
    await userEvent.click(screen.getByRole("button", { name: "Enviar arquivo" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("arquivo_ilegivel")).toBeInTheDocument();
    expect(screen.getByText(/não pôde ser aberto ou interpretado/i)).toBeInTheDocument();
  });

  it("exibe falha da API e permite tentar novamente", async () => {
    vi.mocked(cargaApi.listImportacoes).mockRejectedValue(new Error("offline"));
    setup(3);
    expect(await screen.findByText("Não foi possível carregar os arquivos.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
  });
});
