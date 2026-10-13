import { describe, expect, it } from "vitest";

import { buildOrderingParam, toggleAdminSorting } from "@/lib/adminList";

type SortKey = "name" | "updatedAt";

describe("adminList", () => {
  it("alterna ordenação simples e substitui o critério anterior", () => {
    expect(
      toggleAdminSorting<SortKey>(
        [{ key: "name", direction: "asc" }],
        "updatedAt",
      ),
    ).toEqual([{ key: "updatedAt", direction: "asc" }]);

    expect(
      toggleAdminSorting<SortKey>(
        [{ key: "updatedAt", direction: "asc" }],
        "updatedAt",
      ),
    ).toEqual([{ key: "updatedAt", direction: "desc" }]);
  });

  it("combina critérios quando a interação é aditiva", () => {
    expect(
      toggleAdminSorting<SortKey>(
        [{ key: "name", direction: "asc" }],
        "updatedAt",
        true,
      ),
    ).toEqual([
      { key: "name", direction: "asc" },
      { key: "updatedAt", direction: "asc" },
    ]);
  });

  it("mapeia chaves funcionais sem expor nomes do backend à tela", () => {
    expect(
      buildOrderingParam<SortKey>(
        [
          { key: "name", direction: "asc" },
          { key: "updatedAt", direction: "desc" },
        ],
        { name: "name_column", updatedAt: "updated_at" },
      ),
    ).toBe("name_column,-updated_at");
  });
});
