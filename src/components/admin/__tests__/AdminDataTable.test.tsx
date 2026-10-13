import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  AdminDataTable,
  type AdminTableColumn,
} from "@/components/admin/AdminDataTable";

interface Row {
  id: number;
  description: string;
}

type SortKey = "description";

const columns: AdminTableColumn<Row, SortKey>[] = [
  {
    key: "description",
    label: "Descrição",
    sortKey: "description",
    render: (row) => row.description,
  },
];

function renderTable(overrides = {}) {
  const props = {
    rows: [{ id: 1, description: "Transformação Digital" }],
    columns,
    getRowKey: (row: Row) => row.id,
    sorting: [
      { key: "description" as const, direction: "asc" as const },
    ],
    onSort: vi.fn(),
    page: 1,
    pageSize: 10,
    pageSizeOptions: [10, 20, 50],
    totalCount: 1,
    hasPreviousPage: false,
    hasNextPage: false,
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
    density: "compact" as const,
    onDensityChange: vi.fn(),
    onResetView: vi.fn(),
    ...overrides,
  };
  render(<AdminDataTable<Row, SortKey> {...props} />);
  return props;
}

describe("AdminDataTable", () => {
  it("renderiza colunas e linhas declarativas", () => {
    renderTable();
    expect(screen.getByText("Transformação Digital")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /descrição/i })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
  });

  it("informa Shift+clique como ordenação aditiva", () => {
    const props = renderTable();
    fireEvent.click(screen.getByRole("button", { name: "Descrição" }), {
      shiftKey: true,
    });
    expect(props.onSort).toHaveBeenCalledWith("description", true);
  });

  it("expõe tamanho de página e densidade como preferências controladas", async () => {
    const user = userEvent.setup();
    const props = renderTable();

    await user.selectOptions(screen.getByLabelText("Por página"), "20");
    expect(props.onPageSizeChange).toHaveBeenCalledWith(20);

    await user.click(screen.getByRole("button", { name: "Confortável" }));
    expect(props.onDensityChange).toHaveBeenCalledWith("comfortable");
  });

  it("renderiza erro tratado e permite tentar novamente", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    renderTable({ errorMessage: "Falha ao carregar", onRetry });

    expect(screen.getByRole("alert")).toHaveTextContent("Falha ao carregar");
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
