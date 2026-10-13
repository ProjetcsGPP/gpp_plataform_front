import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminResourceList } from "@/components/admin/AdminResourceList";
import { eixoResource } from "@/features/acoes-pngi/configuracoes/eixos/resource";
import { PERMISSIONS } from "@/lib/permissions";

const { mockCan, mockToggleSorting, mockUseResourceList } = vi.hoisted(() => ({
  mockCan: vi.fn<(permission: string) => boolean>(),
  mockToggleSorting: vi.fn(),
  mockUseResourceList: vi.fn(),
}));

vi.mock("@/hooks/useAdminListState", () => ({
  useAdminListState: () => ({
    query: {
      page: 1,
      pageSize: 10,
      sorting: [{ key: "alias", direction: "asc" }],
    },
    density: "compact",
    pageSizeOptions: [10, 20, 50],
    setPage: vi.fn(),
    setPageSize: vi.fn(),
    setDensity: vi.fn(),
    toggleSorting: mockToggleSorting,
    resetView: vi.fn(),
  }),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({ can: mockCan }),
}));

vi.mock("@/hooks/useAdminResource", () => ({
  useAdminResourceList: (...args: unknown[]) => mockUseResourceList(...args),
}));

describe("AdminResourceList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseResourceList.mockReturnValue({
      data: {
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            ideixo: 1,
            strdescricaoeixo: "Transformação Digital",
            stralias: "TD",
            created_by_id: 1,
            created_by_name: "Usuário",
            updated_by_id: 1,
            updated_by_name: "Usuário",
            created_at: "2026-10-09T10:00:00-03:00",
            updated_at: "2026-10-09T10:00:00-03:00",
          },
        ],
      },
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    });
  });

  it("renderiza a definição e oculta operações não concedidas", () => {
    mockCan.mockReturnValue(false);
    render(<AdminResourceList resource={eixoResource} />);

    expect(screen.getByText("Transformação Digital")).toBeInTheDocument();
    expect(screen.getByText("Usuário")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /novo eixo/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /editar/i }),
    ).not.toBeInTheDocument();
  });

  it("usa permissões efetivas e encaminha a ordenação funcional", async () => {
    const user = userEvent.setup();
    mockCan.mockImplementation(
      (permission) =>
        permission === PERMISSIONS.EIXO_ADD ||
        permission === PERMISSIONS.EIXO_CHANGE,
    );
    render(<AdminResourceList resource={eixoResource} />);

    expect(screen.getByRole("link", { name: /novo eixo/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /editar/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Descrição" }));
    expect(mockToggleSorting).toHaveBeenCalledWith("description", false);
  });
});
