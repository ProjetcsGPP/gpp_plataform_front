// src/components/common/__tests__/AppThemeProvider.test.tsx
// act() warning ocorre quando um useEffect atualiza estado/DOM apos o render.
// A solucao e usar waitFor() nas assertivas — ele envolve act() internamente
// e aguarda o efeito ser aplicado antes de verificar o DOM.
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import { AppThemeProvider } from "../AppThemeProvider";

afterEach(() => {
  cleanup();
  document.body.removeAttribute("data-app");
});

describe("AppThemeProvider", () => {
  it('deve aplicar data-app="PORTAL" no body', async () => {
    render(
      <AppThemeProvider appContext="PORTAL">
        <div>conteúdo</div>
      </AppThemeProvider>,
    );
    await waitFor(() => {
      expect(document.body.getAttribute("data-app")).toBe("PORTAL");
    });
  });

  it('deve aplicar data-app="ACOES_PNGI" no body', async () => {
    render(
      <AppThemeProvider appContext="ACOES_PNGI">
        <div>conteúdo</div>
      </AppThemeProvider>,
    );
    await waitFor(() => {
      expect(document.body.getAttribute("data-app")).toBe("ACOES_PNGI");
    });
  });

  it("deve remover data-app do body ao desmontar", async () => {
    const { unmount } = render(
      <AppThemeProvider appContext="PORTAL">
        <div>conteúdo</div>
      </AppThemeProvider>,
    );
    unmount();
    await waitFor(() => {
      expect(document.body.getAttribute("data-app")).toBeNull();
    });
  });
});
