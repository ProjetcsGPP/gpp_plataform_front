import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminResourceForm } from "@/components/admin/AdminResourceForm";
import { PERMISSIONS } from "@/lib/permissions";
import type { AdminResourceDefinition } from "@/types/adminResource";

interface Row {
  id: number;
  description: string;
  created_by_name: string;
  updated_by_name: string;
  created_at: string;
  updated_at: string;
}

interface Payload {
  description: string;
}

interface Values {
  description: string;
}

type SortKey = "description";

const { mockMutate, mockPush, mockRefresh } = vi.hoisted(() => ({
  mockMutate: vi.fn(),
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

vi.mock("swr", () => ({
  useSWRConfig: () => ({ mutate: mockMutate }),
}));

const initial: Row = {
  id: 7,
  description: "Anterior",
  created_by_name: "Usuário",
  updated_by_name: "Usuário",
  created_at: "2026-10-09T10:00:00-03:00",
  updated_at: "2026-10-09T10:00:00-03:00",
};

function createResource() {
  const update = vi.fn();
  const resource: AdminResourceDefinition<Row, Payload, Values, SortKey> = {
    key: "app.configuracoes.exemplo",
    basePath: "/app/configuracoes/exemplo",
    permissions: {
      view: PERMISSIONS.EIXO_VIEW,
      add: PERMISSIONS.EIXO_ADD,
      change: PERMISSIONS.EIXO_CHANGE,
    },
    api: {
      list: vi.fn(),
      detail: vi.fn(),
      create: vi.fn(),
      update,
    },
    getId: (row) => row.id,
    sortKeys: ["description"],
    defaultPreferences: {
      pageSize: 10,
      density: "compact",
      sorting: [{ key: "description", direction: "asc" }],
    },
    columns: [],
    fields: [
      {
        name: "description",
        label: "Descrição",
        required: true,
      },
    ],
    getInitialValues: (row) => ({ description: row?.description ?? "" }),
    toPayload: (values) => ({ description: values.description.trim() }),
    validate: (values) =>
      values.description.trim() ? null : "Preencha a descrição.",
    texts: {
      listTitle: "Exemplos",
      listDescription: "",
      createAction: "Novo exemplo",
      empty: "Nenhum exemplo.",
      listError: "Falha ao listar.",
      createTitle: "Novo exemplo",
      createDescription: "",
      createError: "Falha ao criar.",
      editTitle: "Editar exemplo",
      editDescription: () => "",
      editError: "Falha ao editar.",
      notFound: "Exemplo não encontrado.",
      loading: "Carregando...",
    },
  };
  return { resource, update };
}

describe("AdminResourceForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutate.mockResolvedValue(undefined);
  });

  it("converte o formulário, grava e mantém os caches coerentes", async () => {
    const user = userEvent.setup();
    const { resource, update } = createResource();
    const saved = { ...initial, description: "Atualizada" };
    update.mockResolvedValue(saved);

    render(<AdminResourceForm resource={resource} record={initial} />);

    const description = screen.getByLabelText("Descrição");
    await user.clear(description);
    await user.type(description, "  Atualizada  ");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(update).toHaveBeenCalledWith(7, { description: "Atualizada" });
    });
    expect(mockMutate).toHaveBeenNthCalledWith(
      1,
      ["app.configuracoes.exemplo:detail", 7],
      saved,
      { revalidate: false },
    );
    expect(mockPush).toHaveBeenCalledWith("/app/configuracoes/exemplo");
  });

  it("aplica a validação declarada pelo recurso", async () => {
    const user = userEvent.setup();
    const { resource, update } = createResource();

    render(<AdminResourceForm resource={resource} />);
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Preencha a descrição.",
    );
    expect(update).not.toHaveBeenCalled();
  });
});
