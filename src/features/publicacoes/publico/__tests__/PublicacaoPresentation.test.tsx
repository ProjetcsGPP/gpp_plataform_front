import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PublicacaoPresentation } from "../PublicacaoPresentation";
import { publicPublication } from "./fixtures";

const donut = vi.fn(({ data, centerTotal }: { data: unknown[]; centerTotal?: number }) => <div data-testid="donut" data-count={data.length} data-center={centerTotal} />);
vi.mock("@/features/publicacoes/eflow/EflowDonutChart", () => ({ EflowDonutChart: (props: unknown) => donut(props as never) }));
vi.mock("../PublicSeriesChart", () => ({
  PublicSeriesChart: ({ title, series, kind }: { title: string; series: Array<{ pontos: Array<{ valor: string | null; valor_acumulado: string | null }> }>; kind: string }) => <div data-testid="series-chart" data-kind={kind} data-values={JSON.stringify(series[0]?.pontos)}>{title}</div>,
  PublicRankingChart: ({ title }: { title: string }) => <div data-testid="ranking-chart">{title}</div>,
}));
vi.mock("@/components/common/MapaMunicipalPublicacao", () => ({ MapaMunicipalPublicacao: () => <div data-testid="frozen-map" /> }));

describe("apresentação reutilizável da publicação", () => {
  beforeEach(() => {
    donut.mockClear();
    Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }) });
  });
  afterEach(() => vi.useRealTimers());

  it("navega pelo carrossel por controles e teclado", async () => {
    const user = userEvent.setup();
    render(<PublicacaoPresentation publicacao={publicPublication} autoPlay={false} />);
    expect(screen.getByRole("heading", { name: "Resultado e-Docs nos Municípios" })).toBeInTheDocument();
    expect(screen.getByText("Total de Páginas em PDF")).toBeInTheDocument();
    expect(screen.getByText("10 páginas")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Próxima etapa" }));
    expect(screen.getByText("Ranking da economia")).toBeInTheDocument();
    expect(screen.getByText("Páginas por mês")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Próxima etapa" }));
    expect(screen.getByTestId("frozen-map")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Próxima etapa" }));
    expect(screen.getByText("Órgãos com mais fluxos")).toBeInTheDocument();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByTestId("frozen-map")).toBeInTheDocument();
  });

  it("organiza os totalizadores E-Docs em quatro linhas com títulos e ícones", () => {
    render(<PublicacaoPresentation publicacao={publicPublication} autoPlay={false} />);
    const expectedTitles = [
      "Economia total", "Total de Páginas em PDF",
      "Economia de Papel", "Economia de Insumos", "Economia de Impressão",
      "Economia de Água", "Redução de CO₂", "Árvores preservadas",
      "Total de Processos", "Total de Documentos", "Papel economizado",
    ];
    for (const title of expectedTitles) expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(11);
    expect(screen.getAllByRole("article").every((card) => card.querySelector("svg"))).toBe(true);
  });

  it("separa os gráficos e os totalizadores do E-Flow em etapas", async () => {
    const user = userEvent.setup();
    render(<PublicacaoPresentation publicacao={publicPublication} autoPlay={false} />);
    await user.click(screen.getByRole("button", { name: "Próxima etapa" }));
    await user.click(screen.getByRole("button", { name: "Próxima etapa" }));
    await user.click(screen.getByRole("button", { name: "Próxima etapa" }));
    expect(donut).toHaveBeenCalled();
    expect(donut.mock.calls.every(([props]) => props.centerTotal === undefined)).toBe(true);
    await user.click(screen.getByRole("button", { name: "Próxima etapa" }));
    expect(screen.getByText("15")).toBeInTheDocument();
  });

  it("oferece tema escuro para toda a apresentação", async () => {
    const user = userEvent.setup();
    render(<PublicacaoPresentation publicacao={publicPublication} autoPlay={false} />);
    const presentation = screen.getByLabelText("Apresentação da publicação");
    expect(presentation).toHaveAttribute("data-theme", "light");
    await user.click(screen.getByRole("button", { name: "Usar tema escuro" }));
    expect(presentation).toHaveAttribute("data-theme", "dark");
    expect(screen.getByRole("button", { name: "Usar tema claro" })).toBeInTheDocument();
  });

  it("oferece gravação somente quando habilitada pela prévia administrativa", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<PublicacaoPresentation publicacao={publicPublication} autoPlay={false} />);
    expect(screen.queryByRole("button", { name: "Gravar apresentação em vídeo" })).not.toBeInTheDocument();

    rerender(<PublicacaoPresentation publicacao={publicPublication} autoPlay={false} videoExportEnabled />);
    await user.click(screen.getByRole("button", { name: "Gravar apresentação em vídeo" }));
    expect(screen.getByRole("dialog", { name: "Gravar apresentação em vídeo" })).toBeInTheDocument();
    expect(screen.getByText(/Este navegador ou contexto não oferece captura/)).toBeInTheDocument();
  });

  it("desativa autoplay com redução de movimento", () => {
    vi.mocked(window.matchMedia).mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as MediaQueryList);
    render(<PublicacaoPresentation publicacao={publicPublication} autoPlay />);
    expect(screen.queryByText("Pausada")).not.toBeInTheDocument();
    expect(screen.queryByText("Reprodução automática")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retomar apresentação" })).toBeInTheDocument();
  });

  it("exibe o rodapé somente durante a reprodução do carrossel", async () => {
    const user = userEvent.setup();
    render(<PublicacaoPresentation publicacao={publicPublication} autoPlay />);
    expect(screen.getByText("Reprodução automática")).toBeInTheDocument();
    expect(screen.getByLabelText("Selecionar etapa")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Pausar apresentação" }));
    expect(screen.queryByText("Reprodução automática")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Selecionar etapa")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retomar apresentação" }));
    expect(screen.getByText("Reprodução automática")).toBeInTheDocument();
  });

  it("oculta os controles após cinco segundos e os recupera com mouse ou teclado", () => {
    vi.useFakeTimers();
    render(<PublicacaoPresentation publicacao={publicPublication} autoPlay={false} toolbarContent={<select aria-label="Histórico da apresentação"><option>Atual</option></select>} />);
    const presentation = screen.getByLabelText("Apresentação da publicação");
    const controls = screen.getByTestId("presentation-controls");
    const historySelect = screen.getByRole("combobox", { name: "Histórico da apresentação" });
    expect(controls).toContainElement(historySelect);
    expect(controls).toHaveAttribute("data-visible", "true");

    fireEvent.focus(historySelect);
    act(() => vi.advanceTimersByTime(5000));
    expect(controls).toHaveAttribute("data-visible", "false");
    expect(controls).toHaveClass("opacity-0");

    fireEvent.pointerMove(presentation);
    expect(controls).toHaveAttribute("data-visible", "true");
    expect(controls).toHaveClass("opacity-100");

    act(() => vi.advanceTimersByTime(5000));
    expect(controls).toHaveAttribute("data-visible", "false");

    fireEvent.keyDown(window, { key: "Shift" });
    expect(controls).toHaveAttribute("data-visible", "true");
    expect(controls).toHaveClass("opacity-100");
  });
});
