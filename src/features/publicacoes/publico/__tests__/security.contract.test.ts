import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("fronteira de segurança da distribuição pública", () => {
  it("não consulta preview, API administrativa, patriarcas atuais ou cache persistente", () => {
    const files = ["api.ts", "PublicacoesPortalPage.tsx", "PublicacaoPresentation.tsx"]
      .map((file) => readFileSync(resolve(process.cwd(), "src/features/publicacoes/publico", file), "utf8"))
      .join("\n");
    expect(files).not.toContain("/pub-institucional/");
    expect(files).not.toContain("/previa/");
    expect(files).not.toContain("/patriarcas/");
    expect(files).not.toContain("localStorage");
    expect(files).not.toContain("sessionStorage");
  });
});
