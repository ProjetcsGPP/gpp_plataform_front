import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthProvider } from "../AuthProvider";

describe("AuthProvider", () => {
  it("deve renderizar os filhos", () => {
    render(
      <AuthProvider>
        <div>conteúdo</div>
      </AuthProvider>,
    );

    expect(screen.getByText("conteúdo")).toBeInTheDocument();
  });

  it("não deve quebrar sem usuário autenticado", () => {
    render(
      <AuthProvider>
        <div>sem usuário</div>
      </AuthProvider>,
    );

    expect(screen.getByText("sem usuário")).toBeInTheDocument();
  });
});
