import { describe, expect, it } from "vitest";

import {
  resolvePortalApplicationContext,
  resolvePortalApplicationDestination,
} from "@/lib/portalApplicationDestination";

describe("destino das aplicações do Portal", () => {
  const frontendOrigin = "http://127.0.0.1:3001";

  it("resolve Publicações na origem do frontend usando o caminho do backend", () => {
    expect(
      resolvePortalApplicationDestination(
        {
          codigointerno: "PUB_INSTITUCIONAL",
          base_url: "http://127.0.0.1:8000/publicacoes",
        },
        frontendOrigin,
      ),
    ).toBe("/publicacoes");
  });

  it("preserva busca e fragmento de um destino válido", () => {
    expect(
      resolvePortalApplicationDestination(
        {
          codigointerno: "PUB_INSTITUCIONAL",
          base_url: "/publicacoes/coletas?pagina=2#resultados",
        },
        frontendOrigin,
      ),
    ).toBe("/publicacoes/coletas?pagina=2#resultados");
  });

  it.each([
    ["PUB_INSTITUCIONAL", "https://example.com/portal/"],
    ["PUB_INSTITUCIONAL", "javascript:alert(1)"],
    ["APLICACAO_DESCONHECIDA", "/publicacoes"],
    ["PUB_INSTITUCIONAL", ""],
  ])("rejeita destino inválido para %s: %s", (codigointerno, base_url) => {
    expect(
      resolvePortalApplicationDestination(
        { codigointerno, base_url },
        frontendOrigin,
      ),
    ).toBeNull();
  });

  it("reconhece apenas AppContexts registrados", () => {
    expect(resolvePortalApplicationContext("PUB_INSTITUCIONAL")).toBe(
      "PUB_INSTITUCIONAL",
    );
    expect(resolvePortalApplicationContext("OUTRA_APLICACAO")).toBeNull();
  });
});
