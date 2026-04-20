import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthProvider } from "../AuthProvider";

const useMeMock = vi.fn();

vi.mock("@/hooks/useMe", () => ({
  useMe: () => useMeMock(),
}));

describe("AuthProvider", () => {
  beforeEach(() => {
    useMeMock.mockClear();
  });

  it("deve chamar useMe", () => {
    render(
      <AuthProvider>
        <div>conteúdo</div>
      </AuthProvider>,
    );

    expect(useMeMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText("conteúdo")).toBeInTheDocument();
  });

  it("não deve quebrar sem usuário autenticado", () => {
    useMeMock.mockImplementation(() => undefined);

    render(
      <AuthProvider>
        <div>sem usuário</div>
      </AuthProvider>,
    );

    expect(screen.getByText("sem usuário")).toBeInTheDocument();
  });
});
