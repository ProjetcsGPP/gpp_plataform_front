import { SWRConfig } from "swr";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrganogramaTreePanel } from "@/features/carga-org-lot/OrganogramaTreeDialog";
import * as cargaApi from "@/features/carga-org-lot/api";
import type { ImportacaoPlanilha } from "@/features/carga-org-lot/model";

vi.mock("@/features/carga-org-lot/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/carga-org-lot/api")>();
  return { ...original, listItensOrganograma: vi.fn(), createItemOrganograma: vi.fn(), updateItemOrganograma: vi.fn(), deleteItemOrganograma: vi.fn() };
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
    granted = new Set(["add_itemorganograma", "change_itemorganograma", "delete_itemorganograma"]);
    vi.mocked(cargaApi.createItemOrganograma).mockResolvedValue({} as never);
    vi.mocked(cargaApi.updateItemOrganograma).mockResolvedValue({} as never);
    vi.mocked(cargaApi.deleteItemOrganograma).mockResolvedValue(undefined);
    vi.mocked(cargaApi.listItensOrganograma).mockResolvedValue([
      {
        iditemorganograma: 1,
        idimportacaoplanilha_id: 7,
        idpai_id: null,
        pai_sigla: null,
        strnome: "Prefeitura Municipal",
        strsigla: "PMBG",
        strnumero: "1",
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
    expect(screen.getByText("Gabinete")).toBeInTheDocument();
    expect(screen.getByText("Pai informado na planilha: PMBG")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Recolher tudo/i }));
    expect(screen.queryByText("Gabinete")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Expandir tudo/i }));
    expect(screen.getByText("Gabinete")).toBeInTheDocument();
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
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <OrganogramaTreePanel importacao={importacao} onClose={vi.fn()} />
      </SWRConfig>,
    );
    await userEvent.click(await screen.findByRole("button", { name: "Adicionar unidade" }));
    await userEvent.type(screen.getByLabelText("Número"), "1.2");
    await userEvent.type(screen.getByLabelText("Sigla"), "sec");
    await userEvent.type(screen.getByLabelText("Nome"), "Secretaria");
    await userEvent.type(screen.getByLabelText("Aba de origem"), "Organograma");
    await userEvent.clear(screen.getByLabelText("Linha de origem"));
    await userEvent.type(screen.getByLabelText("Linha de origem"), "4");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(cargaApi.createItemOrganograma).toHaveBeenCalledWith(expect.objectContaining({ idimportacaoplanilha_id: 7, strsigla: "SEC" })));

    await userEvent.click(screen.getByRole("button", { name: "Editar PMBG" }));
    await userEvent.clear(screen.getByLabelText("Nome"));
    await userEvent.type(screen.getByLabelText("Nome"), "Prefeitura atualizada");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(cargaApi.updateItemOrganograma).toHaveBeenCalledWith(1, expect.objectContaining({ strnome: "Prefeitura atualizada" })));

    await userEvent.click(screen.getByRole("button", { name: "Excluir GAB" }));
    await waitFor(() => expect(cargaApi.deleteItemOrganograma).toHaveBeenCalledWith(2));
  });
});
