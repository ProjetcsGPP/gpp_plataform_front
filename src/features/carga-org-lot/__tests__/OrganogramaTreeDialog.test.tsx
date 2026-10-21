import { SWRConfig } from "swr";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrganogramaTreePanel } from "@/features/carga-org-lot/OrganogramaTreeDialog";
import * as cargaApi from "@/features/carga-org-lot/api";
import type { ImportacaoPlanilha } from "@/features/carga-org-lot/model";

vi.mock("@/features/carga-org-lot/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/carga-org-lot/api")>();
  return { ...original, listItensOrganograma: vi.fn(), getImportacao: vi.fn(), getImpactoExclusaoItem: vi.fn(), createItemOrganograma: vi.fn(), updateItemOrganograma: vi.fn(), deleteItemOrganograma: vi.fn(), downloadArquivo: vi.fn() };
});

let granted = new Set<string>();
vi.mock("@/hooks/usePermissions", () => ({ usePermissions: () => ({ can: (permission: string) => granted.has(permission) }) }));

const importacao = {
  idimportacaoplanilha: 7,
  strnomearquivo: "organograma.xlsx",
} as ImportacaoPlanilha;

describe("visualização hierárquica do organograma", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(HTMLElement.prototype, "scrollTo", { configurable: true, value: vi.fn() });
    granted = new Set(["add_itemorganograma", "change_itemorganograma", "delete_itemorganograma"]);
    vi.mocked(cargaApi.createItemOrganograma).mockResolvedValue({} as never);
    vi.mocked(cargaApi.updateItemOrganograma).mockResolvedValue({} as never);
    vi.mocked(cargaApi.deleteItemOrganograma).mockResolvedValue(undefined);
    vi.mocked(cargaApi.getImportacao).mockResolvedValue(importacao);
    vi.mocked(cargaApi.getImpactoExclusaoItem).mockImplementation(async (id) => ({ unidade_raiz: { iditemorganograma: id, strnumero: "1.1", strsigla: "GAB", strnome: "GABINETE" }, total_descendentes: 0, total_excluidos: 1, unidades: [] }));
    vi.mocked(cargaApi.listItensOrganograma).mockResolvedValue([
      {
        iditemorganograma: 1,
        idimportacaoplanilha_id: 7,
        idpai_id: null,
        pai_sigla: null,
        strnome: "Prefeitura Municipal",
        strsigla: "PMBG",
        strnumero: "1",
        strresponsavel: "",
        strcargo: "",
        flggeradoautomaticamente: false,
        strabaorigem: "Organograma",
        intlinhaorigem: 2,
        strreferenciapai: "",
      },
      {
        iditemorganograma: 2,
        idimportacaoplanilha_id: 7,
        idpai_id: 1,
        pai_sigla: "PMBG",
        strnome: "Gabinete",
        strsigla: "GAB",
        strnumero: "1.1",
        strresponsavel: "Maria da Silva",
        strcargo: "Secretária Municipal",
        flggeradoautomaticamente: false,
        strabaorigem: "Organograma",
        intlinhaorigem: 3,
        strreferenciapai: "PMBG",
      },
    ]);
  });

  it("renderiza dados reais e permite recolher e expandir os ramos", async () => {
    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <OrganogramaTreePanel importacao={importacao} onClose={vi.fn()} />
      </SWRConfig>,
    );

    expect(await screen.findByText("Prefeitura Municipal")).toBeInTheDocument();
    expect(screen.getByText("Patriarca")).toBeInTheDocument();
    const organograma = screen.getByRole("list", { name: "Estrutura do organograma" });
    expect(within(organograma).getByText("Gabinete")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Nível 2 · nº 1.1 · Maria da Silva · Secretária Municipal",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Organograma, linha 3/)).not.toBeInTheDocument();
    expect(screen.getByText("Pai informado na planilha: PMBG")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Recolher tudo/i }));
    expect(within(organograma).queryByText("Gabinete")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Expandir tudo/i }));
    expect(within(organograma).getByText("Gabinete")).toBeInTheDocument();
  });

  it("exibe cards dos órgãos e filtra a árvore pelo órgão escolhido", async () => {
    const base = vi.mocked(cargaApi.listItensOrganograma).getMockImplementation();
    const currentItems = await base?.(7) ?? [];
    vi.mocked(cargaApi.listItensOrganograma).mockResolvedValue([
      ...currentItems,
      {
        ...currentItems[1],
        iditemorganograma: 3,
        idpai_id: 1,
        strsigla: "SESA",
        strnome: "Secretaria de Saúde",
        strnumero: "1.2",
      },
      {
        ...currentItems[1],
        iditemorganograma: 4,
        idpai_id: 3,
        pai_sigla: "SESA",
        strsigla: "APS",
        strnome: "Atenção Primária",
        strnumero: "1.2.1",
      },
    ]);
    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <OrganogramaTreePanel importacao={importacao} onClose={vi.fn()} />
      </SWRConfig>,
    );

    const viewAll = await screen.findByRole("button", { name: "Visualizar tudo" });
    const viewByOrganization = screen.getByRole("button", { name: "Visualizar por órgão" });
    const searchInput = screen.getByLabelText("Pesquisar unidade");
    expect(viewAll).toHaveAttribute("aria-pressed", "true");
    expect(viewByOrganization).toHaveAttribute("aria-pressed", "false");
    expect(
      viewByOrganization.compareDocumentPosition(searchInput)
      & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByRole("list", { name: "Estrutura do organograma" })).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Órgãos do organograma" })).not.toBeInTheDocument();

    await userEvent.click(viewByOrganization);
    expect(viewByOrganization).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("list", { name: "Estrutura do organograma" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "2 órgãos no organograma" })).toBeInTheDocument();
    expect(screen.getByLabelText("Pesquisar unidade")).toBeDisabled();

    const healthCard = await screen.findByRole("button", {
      name: "Visualizar SESA - Secretaria de Saúde",
    });
    expect(screen.getByRole("button", { name: "Visualizar GAB - Gabinete" })).toBeInTheDocument();
    await userEvent.click(healthCard);

    const organograma = screen.getByRole("list", { name: "Estrutura do organograma" });
    expect(within(organograma).getByText("Secretaria de Saúde")).toBeInTheDocument();
    expect(within(organograma).getByText("Atenção Primária")).toBeInTheDocument();
    expect(within(organograma).queryByText("Prefeitura Municipal")).not.toBeInTheDocument();
    expect(within(organograma).queryByText("Gabinete")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Pesquisar unidade")).toBeEnabled();

    await userEvent.click(screen.getByRole("button", { name: "Voltar aos órgãos" }));
    expect(screen.getByRole("list", { name: "Órgãos do organograma" })).toBeInTheDocument();

    await userEvent.click(viewAll);
    const completeOrganograma = screen.getByRole("list", { name: "Estrutura do organograma" });
    expect(within(completeOrganograma).getByText("Prefeitura Municipal")).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Órgãos do organograma" })).not.toBeInTheDocument();
  });

  it("fecha com Escape", async () => {
    const onClose = vi.fn();
    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <OrganogramaTreePanel importacao={importacao} onClose={onClose} />
      </SWRConfig>,
    );
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("controla o CRUD pelas permissões efetivas", async () => {
    const { unmount } = render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <OrganogramaTreePanel importacao={importacao} onClose={vi.fn()} />
      </SWRConfig>,
    );
    expect(await screen.findByRole("button", { name: "Adicionar unidade" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editar PMBG" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Excluir PMBG" })).toBeInTheDocument();
    unmount();

    granted = new Set();
    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <OrganogramaTreePanel importacao={importacao} onClose={vi.fn()} />
      </SWRConfig>,
    );
    await screen.findByText("Prefeitura Municipal");
    expect(screen.queryByRole("button", { name: "Adicionar unidade" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar PMBG" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Excluir PMBG" })).not.toBeInTheDocument();
  });

  it("cria e edita uma unidade pelos endpoints do CRUD", async () => {
    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <OrganogramaTreePanel importacao={importacao} onClose={vi.fn()} />
      </SWRConfig>,
    );
    await userEvent.click(await screen.findByRole("button", { name: "Adicionar unidade" }));
    expect(screen.getByLabelText("Número do item")).toHaveValue("1.2");
    expect(screen.getByLabelText("Item pai")).toBeEnabled();
    expect(screen.getByLabelText("Número do item")).toBeEnabled();
    expect(screen.getByText(/Tipo do item:/)).toHaveTextContent("Órgão");
    expect(screen.getByLabelText("Sigla")).toHaveAttribute("maxlength", "20");
    expect(screen.getByLabelText("Nome")).toHaveAttribute("maxlength", "100");
    expect(screen.queryByLabelText("Referência do pai")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Aba de origem")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Linha de origem")).not.toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText("Item pai"), "1");
    expect(screen.getByLabelText("Número do item")).toHaveValue("1.2");
    await userEvent.type(screen.getByLabelText("Sigla"), "s e c");
    await userEvent.type(screen.getByLabelText("Nome"), "Secretaria");
    await userEvent.type(screen.getByLabelText("Responsável"), "Joana Souza");
    expect(screen.getByLabelText("Sigla")).toHaveValue("SEC");
    expect(screen.getByLabelText("Nome")).toHaveValue("SECRETARIA");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(cargaApi.createItemOrganograma).toHaveBeenCalledWith({ idimportacaoplanilha_id: 7, idpai_id: 1, strnumero: "1.2", strsigla: "SEC", strnome: "SECRETARIA", strresponsavel: "Joana Souza", strcargo: "" }));
    await waitFor(() => expect(vi.mocked(cargaApi.getImportacao).mock.calls.length).toBeGreaterThan(1));

    await userEvent.click(screen.getByRole("button", { name: "Editar PMBG" }));
    expect(screen.getByRole("dialog", { name: "Editar item do organograma" })).toBeInTheDocument();
    expect(screen.getByLabelText("Número do item")).toHaveValue("1");
    expect(screen.getByLabelText("Item pai")).toBeDisabled();
    expect(screen.getByLabelText("Número do item")).toBeDisabled();
    expect(screen.queryByLabelText("Referência do pai")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Aba de origem")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Linha de origem")).not.toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText("Nome"));
    await userEvent.type(screen.getByLabelText("Nome"), "Prefeitura atualizada");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(cargaApi.updateItemOrganograma).toHaveBeenCalledWith(1, expect.objectContaining({ strnome: "PREFEITURA ATUALIZADA" })));

    await userEvent.click(screen.getByRole("button", { name: "Excluir GAB" }));
    expect(
      screen.getByRole("dialog", { name: "Excluir unidade?" }),
    ).toHaveTextContent("A unidade GAB - Gabinete será excluída permanentemente.");
    await userEvent.click(screen.getByRole("button", { name: "Excluir definitivamente" }));
    await waitFor(() => expect(cargaApi.deleteItemOrganograma).toHaveBeenCalledWith(2, false));
  });

  it("aceita os limites exatos de órgão e recalcula os limites pelo pai", async () => {
    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <OrganogramaTreePanel importacao={importacao} onClose={vi.fn()} />
      </SWRConfig>,
    );

    await userEvent.click(await screen.findByRole("button", { name: "Adicionar unidade" }));
    const sigla = screen.getByLabelText("Sigla");
    const nome = screen.getByLabelText("Nome");
    await userEvent.type(sigla, "S".repeat(20));
    await userEvent.type(nome, "N".repeat(100));
    expect(screen.getByText("20/20")).toBeInTheDocument();
    expect(screen.getByText("100/100")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(cargaApi.createItemOrganograma).toHaveBeenCalledWith(
      expect.objectContaining({
        idpai_id: 1,
        strsigla: "S".repeat(20),
        strnome: "N".repeat(100),
      }),
    ));
  });

  it("aceita os limites exatos de unidade", async () => {
    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <OrganogramaTreePanel importacao={importacao} onClose={vi.fn()} />
      </SWRConfig>,
    );

    await userEvent.click(await screen.findByRole("button", {
      name: "Adicionar unidade abaixo de GAB",
    }));
    expect(screen.getByText(/Tipo do item:/)).toHaveTextContent("Unidade");
    expect(screen.getByLabelText("Sigla")).toHaveAttribute("maxlength", "25");
    await userEvent.type(screen.getByLabelText("Sigla"), "U".repeat(25));
    await userEvent.type(screen.getByLabelText("Nome"), "N".repeat(100));
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(cargaApi.createItemOrganograma).toHaveBeenCalledWith(
      expect.objectContaining({
        idpai_id: 2,
        strsigla: "U".repeat(25),
        strnome: "N".repeat(100),
      }),
    ));
  });

  it("sinaliza uma sigla que passa do novo limite ao trocar o pai", async () => {
    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <OrganogramaTreePanel importacao={importacao} onClose={vi.fn()} />
      </SWRConfig>,
    );

    await userEvent.click(await screen.findByRole("button", {
      name: "Adicionar unidade abaixo de GAB",
    }));
    await userEvent.type(screen.getByLabelText("Sigla"), "U".repeat(25));
    await userEvent.type(screen.getByLabelText("Nome"), "Unidade teste");
    await userEvent.selectOptions(screen.getByLabelText("Item pai"), "1");

    expect(screen.getByText(/Tipo do item:/)).toHaveTextContent("Órgão");
    expect(screen.getByText("25/20")).toHaveClass("text-red-700");
    expect(screen.getByText(/sigla do órgão pode ter no máximo 20/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(cargaApi.createItemOrganograma).not.toHaveBeenCalled();
  });

  it("mantém o cursor na posição editada ao converter sigla e nome para maiúsculas", async () => {
    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <OrganogramaTreePanel importacao={importacao} onClose={vi.fn()} />
      </SWRConfig>,
    );

    await userEvent.click(await screen.findByRole("button", { name: "Editar PMBG" }));

    const sigla = screen.getByLabelText("Sigla") as HTMLInputElement;
    sigla.focus();
    sigla.setSelectionRange(0, 0);
    await userEvent.type(sigla, "x", { skipClick: true });
    expect(sigla).toHaveValue("XPMBG");
    expect(sigla).toHaveProperty("selectionStart", 1);

    sigla.setSelectionRange(2, 2);
    await userEvent.type(sigla, "z", { skipClick: true });
    expect(sigla).toHaveValue("XPZMBG");
    expect(sigla).toHaveProperty("selectionStart", 3);

    const nome = screen.getByLabelText("Nome") as HTMLInputElement;
    nome.focus();
    nome.setSelectionRange(4, 4);
    await userEvent.type(nome, "x", { skipClick: true });
    expect(nome).toHaveValue("PREFXEITURA MUNICIPAL");
    expect(nome).toHaveProperty("selectionStart", 5);
  });

  it("permite editar e limpar responsável e cargo", async () => {
    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <OrganogramaTreePanel importacao={importacao} onClose={vi.fn()} />
      </SWRConfig>,
    );

    await userEvent.click(await screen.findByRole("button", { name: "Editar GAB" }));
    expect(screen.getByLabelText("Responsável")).toHaveValue("Maria da Silva");
    expect(screen.getByLabelText("Cargo/Função")).toHaveValue("Secretária Municipal");

    await userEvent.clear(screen.getByLabelText("Responsável"));
    await userEvent.clear(screen.getByLabelText("Cargo/Função"));
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(cargaApi.updateItemOrganograma).toHaveBeenCalledWith(
        2,
        expect.objectContaining({ strresponsavel: "", strcargo: "" }),
      ),
    );
  });

  it("abre a inclusão da linha com a unidade pai previamente selecionada", async () => {
    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <OrganogramaTreePanel importacao={importacao} onClose={vi.fn()} />
      </SWRConfig>,
    );

    await userEvent.click(
      await screen.findByRole("button", {
        name: "Adicionar unidade abaixo de GAB",
      }),
    );

    expect(screen.getByRole("dialog", { name: "Adicionar item ao organograma" })).toBeInTheDocument();
    expect(screen.getByLabelText("Item pai")).toHaveValue("2");
    expect(screen.getByLabelText("Número do item")).toHaveValue("1.1.1");
    expect(
      screen.getByRole("button", {
        name: "Adicionar unidade abaixo de PMBG",
      }),
    ).toHaveTextContent("Adicionar Unidade Abaixo");
  });

  it("permite repetir sigla e nome do pai fora do segundo nível", async () => {
    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <OrganogramaTreePanel importacao={importacao} onClose={vi.fn()} />
      </SWRConfig>,
    );

    await userEvent.click(
      await screen.findByRole("button", {
        name: "Adicionar unidade abaixo de GAB",
      }),
    );
    await userEvent.type(screen.getByLabelText("Sigla"), "gab");
    await userEvent.type(screen.getByLabelText("Nome"), "gabinete");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(cargaApi.createItemOrganograma).toHaveBeenCalledWith(
        expect.objectContaining({
          idpai_id: 2,
          strsigla: "GAB",
          strnome: "GABINETE",
        }),
      ),
    );
  });

  it("vincula ao campo de sigla o erro de unicidade devolvido pelo backend", async () => {
    vi.mocked(cargaApi.createItemOrganograma).mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          success: false,
          errors: {
            strsigla: [
              "A sigla do órgão deve ser única no nível 2.",
            ],
          },
        },
      },
    });
    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <OrganogramaTreePanel importacao={importacao} onClose={vi.fn()} />
      </SWRConfig>,
    );

    await userEvent.click(await screen.findByRole("button", { name: "Adicionar unidade" }));
    await userEvent.type(screen.getByLabelText("Sigla"), "pmbg");
    await userEvent.type(screen.getByLabelText("Nome"), "Outro órgão");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText(/deve ser única no nível 2/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Sigla")).toHaveAttribute("aria-invalid", "true");
    expect(cargaApi.createItemOrganograma).toHaveBeenCalledOnce();
  });

  it("ordena numericamente as unidades disponíveis como pai", async () => {
    const base = vi.mocked(cargaApi.listItensOrganograma).getMockImplementation();
    const currentItems = await base?.(7) ?? [];
    vi.mocked(cargaApi.listItensOrganograma).mockResolvedValue([
      ...currentItems,
      { ...currentItems[1], iditemorganograma: 10, strnumero: "1.10", strsigla: "DEC" },
      { ...currentItems[1], iditemorganograma: 3, strnumero: "1.2", strsigla: "SEG" },
    ]);
    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <OrganogramaTreePanel importacao={importacao} onClose={vi.fn()} />
      </SWRConfig>,
    );

    await userEvent.click(await screen.findByRole("button", { name: "Adicionar unidade" }));
    const options = screen.getAllByRole("option").map((option) => option.textContent);
    expect(options).toEqual(["1 - PMBG", "1.1 - GAB", "1.2 - SEG", "1.10 - DEC"]);
  });

  it("seleciona a raiz estrutural pela sigla e continua a numeração de primeiro nível", async () => {
    const base = vi.mocked(cargaApi.listItensOrganograma).getMockImplementation();
    const currentItems = await base?.(7) ?? [];
    vi.mocked(cargaApi.listItensOrganograma).mockResolvedValue([
      { ...currentItems[0], strnumero: "", strsigla: "PMEXE" },
      { ...currentItems[1], strnumero: "1", idpai_id: 1, strsigla: "GAB" },
      { ...currentItems[1], iditemorganograma: 19, strnumero: "19", idpai_id: 1, strsigla: "SMSA" },
    ]);
    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <OrganogramaTreePanel importacao={importacao} onClose={vi.fn()} />
      </SWRConfig>,
    );

    await userEvent.click(await screen.findByRole("button", { name: "Adicionar unidade" }));
    expect(screen.getByLabelText("Item pai")).toHaveValue("1");
    expect(screen.getByRole("option", { name: "PMEXE" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Raiz" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Número do item")).toHaveValue("20");
  });

  it("pesquisa por sigla ou nome, expande o ramo e posiciona o resultado", async () => {
    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <OrganogramaTreePanel importacao={importacao} onClose={vi.fn()} />
      </SWRConfig>,
    );
    await userEvent.click(await screen.findByRole("button", { name: /Recolher tudo/i }));
    const organograma = screen.getByRole("list", { name: "Estrutura do organograma" });
    expect(within(organograma).queryByText("Gabinete")).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Pesquisar unidade"), "gab");
    await userEvent.click(screen.getByRole("button", { name: "Pesquisar" }));

    expect(await within(organograma).findByText("Gabinete")).toBeInTheDocument();
    expect(screen.getByText("1 de 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Resultado anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Próximo resultado" })).toBeDisabled();
    await waitFor(() => expect(HTMLElement.prototype.scrollTo).toHaveBeenCalled());
  });

  it("navega entre várias ocorrências respeitando o primeiro e o último resultado", async () => {
    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <OrganogramaTreePanel importacao={importacao} onClose={vi.fn()} />
      </SWRConfig>,
    );
    await screen.findByText("Prefeitura Municipal");
    await userEvent.type(screen.getByLabelText("Pesquisar unidade"), "e");
    await userEvent.click(screen.getByRole("button", { name: "Pesquisar" }));

    expect(screen.getByText("1 de 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Resultado anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Próximo resultado" })).toBeEnabled();
    await userEvent.click(screen.getByRole("button", { name: "Próximo resultado" }));
    expect(screen.getByText("2 de 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Resultado anterior" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Próximo resultado" })).toBeDisabled();
  });

  it("informa em modal quando a pesquisa não encontra unidade", async () => {
    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <OrganogramaTreePanel importacao={importacao} onClose={vi.fn()} />
      </SWRConfig>,
    );
    await screen.findByText("Prefeitura Municipal");
    await userEvent.type(screen.getByLabelText("Pesquisar unidade"), "inexistente");
    await userEvent.click(screen.getByRole("button", { name: "Pesquisar" }));

    expect(screen.getByRole("dialog", { name: "Nenhuma unidade encontrada" })).toBeInTheDocument();
    expect(screen.getByText(/“inexistente”/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Entendi" }));
    expect(screen.queryByRole("dialog", { name: "Nenhuma unidade encontrada" })).not.toBeInTheDocument();
  });

  it("deixa a validação de unicidade definitiva para o backend", async () => {
    const base = vi.mocked(cargaApi.listItensOrganograma).getMockImplementation();
    const currentItems = await base?.(7) ?? [];
    vi.mocked(cargaApi.listItensOrganograma).mockResolvedValue([
      ...currentItems,
      {
        ...currentItems[1],
        iditemorganograma: 3,
        idpai_id: 1,
        strnumero: "1.2",
        strsigla: "SEC",
        strnome: "Secretaria",
      },
    ]);
    render(<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}><OrganogramaTreePanel importacao={importacao} onClose={vi.fn()} /></SWRConfig>);

    await userEvent.click(await screen.findByRole("button", { name: "Editar GAB" }));
    expect(screen.getByLabelText("Item pai")).toBeEnabled();
    expect(screen.getByLabelText("Número do item")).toBeDisabled();

    await userEvent.clear(screen.getByLabelText("Sigla"));
    await userEvent.type(screen.getByLabelText("Sigla"), "sec");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(cargaApi.updateItemOrganograma).toHaveBeenCalledWith(
      2,
      expect.objectContaining({ strsigla: "SEC" }),
    ));
  });

  it("confirma a exclusão de subárvore somente após consultar o impacto", async () => {
    vi.mocked(cargaApi.getImpactoExclusaoItem).mockResolvedValue({ unidade_raiz: { iditemorganograma: 2, strnumero: "1.1", strsigla: "GAB", strnome: "GABINETE" }, total_descendentes: 12, total_excluidos: 13, unidades: [] });
    render(<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}><OrganogramaTreePanel importacao={importacao} onClose={vi.fn()} /></SWRConfig>);

    await userEvent.click(await screen.findByRole("button", { name: "Excluir GAB" }));
    expect(
      await screen.findByRole("dialog", { name: "Excluir unidade?" }),
    ).toHaveTextContent(/possui 12 unidades subordinadas/i);
    expect(cargaApi.deleteItemOrganograma).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Excluir definitivamente" }));
    await waitFor(() => expect(cargaApi.deleteItemOrganograma).toHaveBeenCalledWith(2, true));
  });

  it("destaca alterações e oferece separadamente os dois downloads", async () => {
    granted.add("view_importacaoplanilha");
    vi.mocked(cargaApi.getImportacao).mockResolvedValue({ ...importacao, patriarca: { strsiglapatriarca: "PMBG" } as never, flgpossuialteracoes: true, organograma_atualizado_download_url: "/download/atualizado/", download_url: "/download/original/", processo: { strstatuslotacao: "DESATUALIZADA" } as never });
    render(<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}><OrganogramaTreePanel importacao={importacao} onClose={vi.fn()} /></SWRConfig>);

    const changesMark = await screen.findByRole("button", { name: "Organograma com alterações manuais" });
    await userEvent.hover(changesMark);
    expect(await screen.findByRole("tooltip")).toHaveTextContent("A planilha original foi preservada");
    expect(screen.getByText(/lotações estão desatualizadas/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Planilha original" }));
    await userEvent.click(screen.getByRole("button", { name: "Organograma atualizado" }));
    expect(cargaApi.downloadArquivo).toHaveBeenNthCalledWith(1, "/download/original/", "organograma.xlsx");
    expect(cargaApi.downloadArquivo).toHaveBeenNthCalledWith(2, "/download/atualizado/", "organograma-atualizado-PMBG.xlsx");
  });
});
