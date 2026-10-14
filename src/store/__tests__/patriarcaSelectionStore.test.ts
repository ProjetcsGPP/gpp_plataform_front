import { beforeEach, describe, expect, it } from "vitest";

import { usePatriarcaSelectionStore } from "@/store/patriarcaSelectionStore";

describe("seleção de patriarca", () => {
  beforeEach(() => {
    usePatriarcaSelectionStore.getState().clear();
    localStorage.clear();
  });

  it("mantém apenas a escolha efêmera da sessão atual", () => {
    const { selectForUser, clear } = usePatriarcaSelectionStore.getState();
    selectForUser(10, { idpatriarca: 1, strsiglapatriarca: "PMBG", strnome: "Prefeitura" });
    expect(usePatriarcaSelectionStore.getState()).toMatchObject({
      selected: { idpatriarca: 1, strsiglapatriarca: "PMBG", strnome: "Prefeitura" },
      selectedForUserId: 10,
    });
    expect(localStorage.getItem("carga-org-lot-patriarca-selection")).toBeNull();

    clear();
    expect(usePatriarcaSelectionStore.getState()).toMatchObject({
      selected: null,
      selectedForUserId: null,
    });
  });
});
