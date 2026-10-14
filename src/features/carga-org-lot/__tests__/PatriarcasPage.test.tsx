import { SWRConfig } from "swr";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PatriarcasPage } from "@/features/carga-org-lot/PatriarcasPage";
import * as cargaApi from "@/features/carga-org-lot/api";

const select = vi.fn();
vi.mock("@/components/common/RouteGuard", () => ({ RouteGuard: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/hooks/usePermissions", () => ({ usePermissions: () => ({ can: () => true }) }));
vi.mock("@/features/carga-org-lot/usePatriarcaSelection", () => ({
  usePatriarcaSelection: () => ({ selected: null, select }),
}));
vi.mock("@/features/carga-org-lot/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/carga-org-lot/api")>();
  return { ...original, listPatriarcas: vi.fn() };
});

const patriarca = {
  idpatriarca: 1,
  idexternopatriarca: "uuid",
  strsiglapatriarca: "PMBG",
  strnome: "Prefeitura Municipal",
  datcriacao: "2026-10-01T12:00:00Z",
  datalteracao: null,
  idstatusprogresso_id: 1,
  status: { idstatusprogresso: 1, strdescricao: "Novo" },
  organograma_download_url: "/download/",
};

describe("lista de patriarcas", () => {
  beforeEach(() => {
    select.mockReset();
    vi.mocked(cargaApi.listPatriarcas).mockResolvedValue({ count: 1, next: null, previous: null, results: [patriarca] });
  });

  it("permite selecionar o contexto sem oferecer exclusão ou download", async () => {
    render(<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}><PatriarcasPage /></SWRConfig>);
    await userEvent.click(await screen.findByRole("button", { name: "Selecionar" }));
    expect(select).toHaveBeenCalledWith(patriarca);
    expect(screen.queryByRole("button", { name: /excluir/i })).not.toBeInTheDocument();
    expect(screen.queryByTitle(/baixar organograma/i)).not.toBeInTheDocument();
  });
});
