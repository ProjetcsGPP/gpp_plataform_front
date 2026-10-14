import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import api from "@/lib/api";
import { login, logoutApp } from "@/lib/auth";
import { usePatriarcaSelectionStore } from "@/store/patriarcaSelectionStore";

const patriarca = {
  idpatriarca: 1,
  strsiglapatriarca: "PMBG",
  strnome: "Prefeitura",
};

describe("ciclo de sessão da seleção de patriarca", () => {
  beforeEach(() => {
    usePatriarcaSelectionStore.getState().clear();
    vi.spyOn(api, "post").mockResolvedValue({ data: {} });
  });

  afterEach(() => vi.restoreAllMocks());

  it("limpa a seleção ao iniciar uma nova sessão do CARGA_ORG_LOT", async () => {
    usePatriarcaSelectionStore.getState().selectForUser(10, patriarca);

    await login("usuario", "senha", "CARGA_ORG_LOT");

    expect(usePatriarcaSelectionStore.getState().selected).toBeNull();
  });

  it("limpa a seleção ao encerrar a sessão do CARGA_ORG_LOT", async () => {
    usePatriarcaSelectionStore.getState().selectForUser(10, patriarca);

    await logoutApp("CARGA_ORG_LOT");

    expect(usePatriarcaSelectionStore.getState().selected).toBeNull();
  });
});
