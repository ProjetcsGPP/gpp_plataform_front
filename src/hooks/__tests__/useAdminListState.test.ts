import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAdminListState } from "@/hooks/useAdminListState";

const mockReplace = vi.fn();
let currentSearch = "";

vi.mock("next/navigation", () => ({
  usePathname: () => "/acoes-pngi/configuracoes/eixos",
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(currentSearch),
}));

const options = {
  sortKeys: ["description", "alias", "updatedAt"] as const,
  defaults: {
    pageSize: 10,
    density: "compact" as const,
    sorting: [{ key: "alias" as const, direction: "asc" as const }],
  },
};

describe("useAdminListState", () => {
  beforeEach(() => {
    currentSearch = "";
    mockReplace.mockReset();
  });

  it("lê paginação, densidade e ordenação composta da URL", () => {
    currentSearch =
      "page=2&page_size=20&density=comfortable&sort=description,-updatedAt";
    const { result } = renderHook(() => useAdminListState(options));

    expect(result.current.query).toEqual({
      page: 2,
      pageSize: 20,
      sorting: [
        { key: "description", direction: "asc" },
        { key: "updatedAt", direction: "desc" },
      ],
    });
    expect(result.current.density).toBe("comfortable");
  });

  it("descarta parâmetros inválidos e usa as preferências padrão", () => {
    currentSearch = "page=-1&page_size=999&density=other&sort=invalid";
    const { result } = renderHook(() => useAdminListState(options));

    expect(result.current.query).toEqual({
      page: 1,
      pageSize: 10,
      sorting: [{ key: "alias", direction: "asc" }],
    });
    expect(result.current.density).toBe("compact");
  });

  it("serializa uma nova ordenação na URL e retorna à primeira página", () => {
    currentSearch = "page=3&page_size=20&sort=alias";
    const { result } = renderHook(() => useAdminListState(options));

    act(() => result.current.toggleSorting("description", false));

    expect(mockReplace).toHaveBeenCalledWith(
      "/acoes-pngi/configuracoes/eixos?page=1&page_size=20&sort=description",
      { scroll: false },
    );
  });

  it("altera o tamanho da página somente para opções permitidas", () => {
    const { result } = renderHook(() => useAdminListState(options));

    act(() => result.current.setPageSize(20));
    expect(mockReplace).toHaveBeenCalledWith(
      "/acoes-pngi/configuracoes/eixos?page=1&page_size=20",
      { scroll: false },
    );

    mockReplace.mockClear();
    act(() => result.current.setPageSize(999));
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
