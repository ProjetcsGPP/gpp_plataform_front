import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { GlobalInteractionBlocker } from "@/components/common/GlobalInteractionBlocker";
import { useAuthStore } from "@/store/authStore";
import { useNavigationStore } from "@/store/navigationStore";
import { useNetworkActivityStore } from "@/store/networkActivityStore";

describe("GlobalInteractionBlocker", () => {
  beforeEach(() => {
    useAuthStore.setState({ isAuthenticated: false });
    useNavigationStore.setState({ isLoading: false });
    useNetworkActivityStore.setState({ pendingRequests: 0 });
  });

  it("bloqueia a interação e usa cursor de espera durante requisições", () => {
    useNetworkActivityStore.setState({ pendingRequests: 1 });
    render(<GlobalInteractionBlocker />);

    expect(screen.getByRole("status", { name: /aguarde/i })).toHaveClass(
      "cursor-wait",
    );
  });

  it("bloqueia a renderização do menu para usuário autenticado", () => {
    useAuthStore.setState({ isAuthenticated: true });
    useNavigationStore.setState({ isLoading: true });
    render(<GlobalInteractionBlocker />);

    expect(screen.getByText("Aguarde, carregando informações...")).toBeInTheDocument();
  });

  it("libera a interface quando as informações estão prontas", () => {
    const { container } = render(<GlobalInteractionBlocker />);
    expect(container).toBeEmptyDOMElement();
  });
});
