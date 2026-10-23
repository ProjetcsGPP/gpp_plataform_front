import { SWRConfig } from "swr";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NovaImportacaoLotacaoPage } from "@/features/carga-org-lot/NovaImportacaoLotacaoPage";
import * as cargaApi from "@/features/carga-org-lot/api";
import type {
  ConjuntoLotacao,
  ImportacaoPlanilha,
  ResumoConjuntosOrganograma,
} from "@/features/carga-org-lot/model";

vi.mock("@/components/common/RouteGuard", () => ({
  RouteGuard: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/features/carga-org-lot/usePatriarcaSelection", () => ({
  usePatriarcaSelection: () => ({
    selected: {
      idpatriarca: 1,
      strsiglapatriarca: "PMBG",
      strnome: "Prefeitura Municipal",
    },
  }),
}));
vi.mock("@/features/carga-org-lot/api", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/features/carga-org-lot/api")>();
  return {
    ...original,
    addImportacaoConjuntoLotacao: vi.fn(),
    getResumoConjuntosOrganograma: vi.fn(),
    listConjuntosLotacao: vi.fn(),
    listImportacoes: vi.fn(),
    uploadImportacao: vi.fn(),
    getValidationReport: vi.fn(),
  };
});

const organograma = {
  idimportacaoplanilha: 7,
  idpatriarca_id: 1,
  patriarca: {} as never,
  idtipocarga_id: 3,
  tipo_carga: { idtipocarga: 3, strdescricao: "Organograma" },
  processo: null,
  idimportacaoorganograma_id: null,
  idstatusprogresso_id: 1,
  status: null,
  strnomearquivo: "organograma.xlsx",
  strtipomime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  inttamanhoarquivo: 100,
  strhasharquivo: "hash",
  strabaimportada: "Organograma",
  strreferencia: "Estrutura oficial 2026",
  strstatusimportacao: "INCORPORADA",
  status_importacao_nome: "Incorporada",
  flgcriarunidadesespelho: false,
  flgpossuialteracoes: false,
  datprimeiraalteracao: null,
  datultimaalteracao: null,
  organograma_atualizado_download_url: null,
  datimportacao: "2026-10-01T12:00:00Z",
  download_url: "/download/7/",
  total_itens_organograma: 42,
  relatorio_validacao: null,
  created_by_id: 5,
  created_by_name: "Usuário teste",
} satisfies ImportacaoPlanilha;

const created = {
  ...organograma,
  idimportacaoplanilha: 21,
  idtipocarga_id: 4,
  tipo_carga: { idtipocarga: 4, strdescricao: "Lotação" },
  idimportacaoorganograma_id: 7,
  idconjuntolotacao_id: 31,
  strtipooperacaolotacao: "INICIAL",
  strnomearquivo: "lotacoes.xlsx",
  strreferencia: "Outubro de 2026",
  strstatusimportacao: "AGUARDANDO_REVISAO",
  status_importacao_nome: "Aguardando revisão",
} satisfies ImportacaoPlanilha;

const empty = { count: 0, next: null, previous: null, results: [] };

const activeSet = {
  idconjuntolotacao: 30,
  idpatriarca_id: 1,
  idimportacaoorganograma_id: 7,
  idconjuntoanterior_id: null,
  strreferencia: "Versão vigente 2026",
  strsituacao: "ATIVO",
  situacao_nome: "Ativo",
  strjustificativaultimaacao: "Homologado pela prefeitura.",
  dathomologacao: "2026-10-10T12:00:00Z",
  datativacao: "2026-10-11T12:00:00Z",
  datcancelamento: null,
  total_importacoes: 2,
  total_registros: 25,
  total_casos_pendentes: 0,
  total_registros_descartados: 1,
  idconjuntosubstituto: null,
  download_consolidado_url: "/conjuntos/30/download/",
  created_by_id: 5,
  created_by_name: "Usuário teste",
  updated_by_id: 5,
  updated_by_name: "Usuário teste",
  created_at: "2026-10-01T12:00:00Z",
  updated_at: "2026-10-11T12:00:00Z",
  patriarca_resumo: {
    idpatriarca: 1,
    sigla: "PMV",
    nome: "Prefeitura de Vitória",
  },
  organograma_resumo: {
    idimportacaoplanilha: 7,
    referencia: "Estrutura oficial 2026",
    nome_arquivo: "organograma.xlsx",
    status: "VALIDADA",
    data_importacao: "2026-10-01T12:00:00Z",
  },
  acoes_disponiveis: {
    adicionar_planilha: { permitida: false, motivo: "Conjunto fechado." },
    homologar: { permitida: false, motivo: "Conjunto já homologado." },
    ativar: { permitida: false, motivo: "Conjunto já ativo." },
    cancelar: { permitida: true, motivo: "" },
  },
} satisfies ConjuntoLotacao;

const draftSet = {
  ...activeSet,
  idconjuntolotacao: 31,
  strreferencia: "Revisão de novembro",
  strsituacao: "COM_PENDENCIAS",
  situacao_nome: "Com pendências",
  datativacao: null,
  total_importacoes: 1,
  total_registros: 18,
  total_casos_pendentes: 3,
} satisfies ConjuntoLotacao;

const emptySummary = {
  idimportacaoorganograma: 7,
  total_conjuntos: 0,
  total_importacoes: 0,
  conjuntos_em_validacao: 0,
  conjuntos_com_pendencias: 0,
  conjunto_ativo: null,
} satisfies ResumoConjuntosOrganograma;

function setup() {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <NovaImportacaoLotacaoPage />
    </SWRConfig>,
  );
}

describe("nova importação de lotações", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cargaApi.listImportacoes).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [organograma],
    });
    vi.mocked(cargaApi.uploadImportacao).mockResolvedValue(created);
    vi.mocked(cargaApi.addImportacaoConjuntoLotacao).mockResolvedValue({
      ...created,
      strtipooperacaolotacao: "ACRESCIMO",
    });
    vi.mocked(cargaApi.getResumoConjuntosOrganograma).mockResolvedValue(
      emptySummary,
    );
    vi.mocked(cargaApi.listConjuntosLotacao).mockResolvedValue(empty);
    vi.mocked(cargaApi.getValidationReport).mockReturnValue(null);
  });

  it("separa a planilha de lotações e exige um organograma válido", async () => {
    setup();

    expect(
      screen.getByRole("heading", { name: "Nova importação de lotações" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("PMBG - Prefeitura Municipal")).not.toBeInTheDocument();
    expect(
      await screen.findByRole("option", {
        name: /Estrutura oficial 2026 · Incorporada · 42 itens · sem alterações manuais/,
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    await userEvent.selectOptions(
      screen.getByLabelText("Organograma de referência"),
      "7",
    );
    expect(
      await screen.findByText("Primeiro conjunto de lotações"),
    ).toBeInTheDocument();
    expect(screen.getByText("Sem alterações manuais")).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("permite continuar um conjunto aberto sem alterar o conjunto ativo", async () => {
    vi.mocked(cargaApi.getResumoConjuntosOrganograma).mockResolvedValue({
      ...emptySummary,
      total_conjuntos: 2,
      total_importacoes: 3,
      conjunto_ativo: activeSet,
    });
    vi.mocked(cargaApi.listConjuntosLotacao).mockResolvedValue({
      count: 2,
      next: null,
      previous: null,
      results: [draftSet, activeSet],
    });
    setup();
    await screen.findByRole("option", { name: /Estrutura oficial 2026/ });
    await userEvent.selectOptions(
      screen.getByLabelText("Organograma de referência"),
      "7",
    );

    expect(
      await screen.findByText(/25 lotações vigentes/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Continuar conjunto em preparação/ }),
    ).toBeChecked();
    expect(
      screen.getByRole("radio", { name: /Criar nova alternativa/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /Revisão de novembro/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/3 pendência\(s\)/i)).toBeInTheDocument();
  });

  it("envia referência, arquivo e associação usando o contrato atual", async () => {
    setup();
    await screen.findByRole("option", { name: /Estrutura oficial 2026/ });
    await userEvent.selectOptions(
      screen.getByLabelText("Organograma de referência"),
      "7",
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: /Referência da importação/ }),
      "Outubro de 2026",
    );
    const file = new File(["dados"], "lotacoes.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    await userEvent.upload(screen.getByLabelText(/Planilha de lotações/), file);
    await userEvent.click(
      screen.getByRole("button", { name: "Ler e validar planilha" }),
    );

    await waitFor(() =>
      expect(cargaApi.uploadImportacao).toHaveBeenCalledWith(1, 4, file, {
        organogramaId: 7,
        referencia: "Outubro de 2026",
      }),
    );
    expect(
      await screen.findByRole("heading", { name: "Resultado da importação" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Aguardando revisão")).toBeInTheDocument();
    expect(
      screen.getByText(/revise as pendências antes de incorporar/i),
    ).toBeInTheDocument();
    expect(screen.queryByText("Escolha o organograma")).not.toBeInTheDocument();
  });

  it("adiciona a planilha ao conjunto aberto selecionado", async () => {
    vi.mocked(cargaApi.listConjuntosLotacao).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [draftSet],
    });
    setup();
    await screen.findByRole("option", { name: /Estrutura oficial 2026/ });
    await userEvent.selectOptions(
      screen.getByLabelText("Organograma de referência"),
      "7",
    );
    await screen.findByRole("option", { name: /Revisão de novembro/ });
    const file = new File(["dados"], "complemento.xlsx");
    await userEvent.upload(screen.getByLabelText(/Planilha de lotações/), file);
    await userEvent.click(
      screen.getByRole("button", { name: "Ler e validar planilha" }),
    );

    await waitFor(() =>
      expect(cargaApi.addImportacaoConjuntoLotacao).toHaveBeenCalledWith(
        31,
        file,
        "",
      ),
    );
    expect(cargaApi.uploadImportacao).not.toHaveBeenCalled();
  });
});
