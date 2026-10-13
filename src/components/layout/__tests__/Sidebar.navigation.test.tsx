import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Sidebar from "@/components/layout/Sidebar";
import { useNavigationStore } from "@/store/navigationStore";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/acoes-pngi/dashboard",
}));

describe("Sidebar e contexto da navegação", () => {
  beforeEach(() => {
    useNavigationStore.setState({
      appContext: "PORTAL",
      role: "USER",
      isLoading: false,
      items: [
        {
          id: "portal-only",
          label: "Item somente do Portal",
          icon: "home",
          app: "PORTAL",
          href: "/portal/dashboard",
          order: 1,
          enabled: true,
          visible: true,
        },
      ],
    });
  });

  it("não renderiza itens pertencentes à aplicação anterior", () => {
    render(<Sidebar appContext="ACOES_PNGI" />);

    expect(screen.queryByText("Item somente do Portal")).not.toBeInTheDocument();
    expect(
      screen.getByText("Nenhum item de navegação disponível"),
    ).toBeInTheDocument();
  });
});
