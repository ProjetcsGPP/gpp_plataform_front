import { describe, expect, it } from "vitest";

import { resolvePostLoginRedirect } from "@/lib/authRedirect";

describe("redirect posterior ao login", () => {
  const fallback = "/portal/dashboard";

  it("aceita rota interna da mesma aplicação", () => {
    expect(
      resolvePostLoginRedirect("/portal/publicacoes?pagina=2#lista", "PORTAL", fallback),
    ).toBe("/portal/publicacoes?pagina=2#lista");
  });

  it.each([
    "https://evil.example/portal",
    "//evil.example/portal",
    "/\\evil.example/portal",
    "/acoes-pngi/dashboard",
    "/portal/login",
  ])("rejeita destino não confiável: %s", (destination) => {
    expect(resolvePostLoginRedirect(destination, "PORTAL", fallback)).toBe(fallback);
  });
});
