import { SWRConfig } from "swr";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CargosCatalogPage } from "@/features/carga-org-lot/CargosCatalogPage";
import * as cargaApi from "@/features/carga-org-lot/api";
import type { CargoReferencia, VariacaoCargo } from "@/features/carga-org-lot/model";

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({ can: () => true, isLoading: false }),
}));
vi.mock("@/components/common/RouteGuard", () => ({
  RouteGuard: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/features/carga-org-lot/usePatriarcaSelection", () => ({
  usePatriarcaSelection: () => ({
    selected: { idpatriarca: 1, strsiglapatriarca: "PMV", strnome: "Vitória" },
  }),
}));
vi.mock("@/features/carga-org-lot/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/carga-org-lot/api")>();
  return {
    ...original,
    listCargosReferencia: vi.fn(),
    listVariacoesCargo: vi.fn(),
    listMapeamentosCargo: vi.fn(),
    listOcorrenciasCargo: vi.fn(),
    updateCargoReferencia: vi.fn(),
    updateVariacaoCargo: vi.fn(),
    saveMapeamentoCargo: vi.fn(),
  };
});

const audit = {
  created_at: "2026-10-22T10:00:00Z",
  updated_at: "2026-10-22T10:00:00Z",
};
const cargo = {
  ...audit,
  idcargoreferencia: 8,
  strnome: "AUXILIAR ADMINISTRATIVO",
  strchave: "AUXILIAR ADMINISTRATIVO",
  strdescricao: "Cargo administrativo",
  strstatus: "CONFIRMADO",
  status_nome: "Confirmado",
  strorigem: "IMPORTACAO",
  flgativo: true,
} satisfies CargoReferencia;
const variation = {
  ...audit,
  idvariacaocargo: 17,
  idcargoreferencia_id: null,
  cargo_referencia_nome: null,
  strdescricao: "AUX ADM",
  strchave: "AUX ADM",
  strstatus: "NOVA",
  status_nome: "Nova",
  inttotalocorrencias: 14,
  inttotalimportacoes: 2,
  inttotalpatriarcas: 1,
  datprimeiraocorrencia: "2026-10-20T10:00:00Z",
  datultimaocorrencia: "2026-10-22T10:00:00Z",
} satisfies VariacaoCargo;

describe("catálogo de cargos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cargaApi.listCargosReferencia).mockResolvedValue({ count: 1, next: null, previous: null, results: [cargo] });
    vi.mocked(cargaApi.listVariacoesCargo).mockResolvedValue({ count: 1, next: null, previous: null, results: [variation] });
    vi.mocked(cargaApi.listMapeamentosCargo).mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
    vi.mocked(cargaApi.updateVariacaoCargo).mockResolvedValue({ ...variation, idcargoreferencia_id: 8, cargo_referencia_nome: cargo.strnome, strstatus: "CONFIRMADA", status_nome: "Confirmada" });
  });

  it("só efetiva um vínculo global após seleção e confirmação explícita", async () => {
    render(<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}><CargosCatalogPage /></SWRConfig>);

    await userEvent.click(await screen.findByRole("button", { name: "Vincular cargo" }));
    await userEvent.selectOptions(screen.getByLabelText("Cargo canônico"), "8");

    expect(cargaApi.updateVariacaoCargo).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Validar e salvar" })).toBeDisabled();

    await userEvent.click(screen.getByRole("checkbox", { name: /Validei o cargo, a correspondência e o alcance/i }));
    await userEvent.click(screen.getByRole("button", { name: "Validar e salvar" }));

    await waitFor(() => expect(cargaApi.updateVariacaoCargo).toHaveBeenCalledWith(17, {
      idcargoreferencia_id: 8,
    }));
  });

  it("oferece cargos novos e os confirma antes de salvar a correspondência", async () => {
    const newCargo = {
      ...cargo,
      idcargoreferencia: 9,
      strnome: "TÉCNICO ADMINISTRATIVO",
      strchave: "TECNICO ADMINISTRATIVO",
      strstatus: "NOVO" as const,
      status_nome: "Novo",
    };
    vi.mocked(cargaApi.listCargosReferencia).mockResolvedValue({ count: 1, next: null, previous: null, results: [newCargo] });
    vi.mocked(cargaApi.updateCargoReferencia).mockResolvedValue({ ...newCargo, strstatus: "CONFIRMADO", status_nome: "Confirmado" });

    render(<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}><CargosCatalogPage /></SWRConfig>);

    await userEvent.click(await screen.findByRole("button", { name: "Vincular cargo" }));
    expect(cargaApi.listCargosReferencia).toHaveBeenCalledWith({ ativo: true, page_size: 200, ordering: "strnome" });
    await userEvent.selectOptions(screen.getByLabelText("Cargo canônico"), "9");
    expect(screen.getByText(/novo, requer confirmação/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("checkbox", { name: /Validei o cargo, a correspondência e o alcance/i }));
    await userEvent.click(screen.getByRole("button", { name: "Validar e salvar" }));

    await waitFor(() => expect(cargaApi.updateCargoReferencia).toHaveBeenCalledWith(9, {
      strstatus: "CONFIRMADO",
      flgativo: true,
    }));
    expect(cargaApi.updateVariacaoCargo).toHaveBeenCalledWith(17, {
      idcargoreferencia_id: 9,
    });
  });
});
