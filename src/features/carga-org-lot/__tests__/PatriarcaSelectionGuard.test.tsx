import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PatriarcaSelectionGuard } from "@/features/carga-org-lot/PatriarcaSelectionGuard";

let pathname = "/carga-org-lot/dashboard";
let selected: { idpatriarca: number; strsiglapatriarca: string; strnome: string } | null = null;

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));
vi.mock("@/features/carga-org-lot/usePatriarcaSelection", () => ({
  usePatriarcaSelection: () => ({ selected }),
}));
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({ can: () => true }),
}));

describe("contexto obrigatório de patriarca", () => {
  beforeEach(() => {
    pathname = "/carga-org-lot/dashboard";
    selected = null;
  });

  it("libera o dashboard global sem patriarca selecionado", () => {
    render(<PatriarcaSelectionGuard><p>Dashboard global</p></PatriarcaSelectionGuard>);
    expect(screen.getByText("Dashboard global")).toBeInTheDocument();
    expect(screen.queryByText("Selecione um patriarca")).not.toBeInTheDocument();
  });

  it("continua exigindo patriarca nas telas operacionais", () => {
    pathname = "/carga-org-lot/organogramas";
    render(<PatriarcaSelectionGuard><p>Lista de organogramas</p></PatriarcaSelectionGuard>);
    expect(screen.getByText("Selecione um patriarca")).toBeInTheDocument();
    expect(screen.queryByText("Lista de organogramas")).not.toBeInTheDocument();
  });

  it("libera as telas operacionais depois da seleção", () => {
    pathname = "/carga-org-lot/organogramas";
    selected = { idpatriarca: 1, strsiglapatriarca: "PMBG", strnome: "Prefeitura" };
    render(<PatriarcaSelectionGuard><p>Lista de organogramas</p></PatriarcaSelectionGuard>);
    expect(screen.getByText("Lista de organogramas")).toBeInTheDocument();
  });
});
