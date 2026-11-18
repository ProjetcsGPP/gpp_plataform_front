import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PublicacaoVideoExportDialog } from "../PublicacaoVideoExportDialog";

const steps = [
  { key: "totals", title: "Totalizadores" },
  { key: "charts", title: "Gráficos" },
  { key: "map", title: "Mapa" },
];
const mp4 = { extension: "mp4" as const, label: "MP4" as const, mimeType: "video/mp4" };

describe("configuração da apresentação em vídeo", () => {
  it("aplica uma duração única a todas as etapas", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(<PublicacaoVideoExportDialog steps={steps} format={mp4} available onClose={vi.fn()} onStart={onStart} />);

    expect(screen.getByText("Duração total:").parentElement).toHaveTextContent("36 segundos");
    await user.clear(screen.getByRole("spinbutton", { name: "Tempo por etapa em segundos" }));
    await user.type(screen.getByRole("spinbutton", { name: "Tempo por etapa em segundos" }), "8");
    expect(screen.getByText("Duração total:").parentElement).toHaveTextContent("24 segundos");
    await user.click(screen.getByRole("button", { name: "Escolher guia e gravar" }));
    expect(onStart).toHaveBeenCalledWith([8, 8, 8]);
  });

  it("permite configurar cada etapa e informa o fallback WebM", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(<PublicacaoVideoExportDialog steps={steps} format={{ extension: "webm", label: "WebM", mimeType: "video/webm" }} available onClose={vi.fn()} onStart={onStart} />);

    await user.click(screen.getByRole("radio", { name: /Personalizar por etapa/ }));
    const mapDuration = screen.getByRole("spinbutton", { name: "Tempo da etapa 3: Mapa" });
    await user.clear(mapDuration);
    await user.type(mapDuration, "20");
    expect(screen.getByText(/fallback do navegador/)).toBeInTheDocument();
    expect(screen.getByText("Duração total:").parentElement).toHaveTextContent("44 segundos");
    await user.click(screen.getByRole("button", { name: "Escolher guia e gravar" }));
    expect(onStart).toHaveBeenCalledWith([12, 12, 20]);
  });
});
