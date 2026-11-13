import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PublicRankingChart, PublicSeriesChart } from "../PublicSeriesChart";

const { chartSetOption } = vi.hoisted(() => ({ chartSetOption: vi.fn() }));

vi.mock("echarts/core", () => ({
  use: vi.fn(),
  init: () => ({ setOption: chartSetOption, resize: vi.fn(), dispose: vi.fn() }),
}));

const sampleSeries = [{
  codigo: "TOTAL_PAGINAS", titulo: "Páginas", periodicidade: "MENSAL",
  natureza: "FLUXO_MENSAL", unidade: "páginas", precisao: 0,
  serie_completa: false, pontos: [
    { competencia: "2024-01", valor: null, valor_acumulado: null, proveniencia: { tipo: "SEM_DADOS" } },
    { competencia: "2024-02", valor: "12", valor_acumulado: "12", proveniencia: { tipo: "PUBLICACAO" } },
  ],
}];

describe("alternativa acessível das séries públicas", () => {
  beforeEach(() => chartSetOption.mockClear());

  it("mantém valores ausentes como Sem dados e expõe a tabela canônica", () => {
    render(<PublicSeriesChart title="Páginas por mês" series={sampleSeries} />);
    expect(screen.getByText("Consultar dados do gráfico em tabela")).toBeInTheDocument();
    expect(screen.getByText("Sem dados")).toBeInTheDocument();
    expect(screen.getByText("12 páginas")).toBeInTheDocument();
  });

  it("aplica área empilhada aos dados ambientais", () => {
    const environmental = [
      { ...sampleSeries[0], codigo: "ECONOMIA_AGUA_M3", titulo: "Economia de água" },
      { ...sampleSeries[0], codigo: "ECONOMIA_PAPEL_KG", titulo: "Economia de papel" },
      { ...sampleSeries[0], codigo: "GASES_POLUENTES_KG", titulo: "Redução de CO₂" },
    ];
    render(<PublicSeriesChart title="Dados ambientais" series={environmental} kind="area-stack" compact />);
    const option = chartSetOption.mock.calls[0][0];
    expect(option.xAxis.boundaryGap).toBe(false);
    expect(option.xAxis.axisLabel.rotate).toBe(90);
    expect(option.xAxis.axisLabel.formatter("2024-02")).toBe("fevereiro");
    expect(option.xAxis.splitLine.interval(0, "2025-01")).toBe(true);
    expect(option.tooltip.axisPointer.type).toBe("cross");
    expect(option.series[0]).toMatchObject({ type: "line", stack: "ambiental", emphasis: { focus: "series" } });
    expect(option.series[0].areaStyle).toBeTruthy();
    expect(option.series.map((item: { itemStyle: { color: string } }) => item.itemStyle.color)).toEqual(["#93c5fd", "#3b82f6", "#1e3a8a"]);
    expect(option.series[0].markLine.data).toEqual([{ name: "2024", xAxis: "2024-01" }]);
  });

  it("alinha barras e marcas nas páginas por mês", () => {
    const pages = [{
      ...sampleSeries[0],
      pontos: sampleSeries[0].pontos.map((point, index) => index === 0 ? { ...point, valor: "5" } : point),
    }];
    render(<PublicSeriesChart title="Páginas por mês" series={pages} kind="bar-aligned" compact />);
    const option = chartSetOption.mock.calls[0][0];
    expect(option.xAxis.axisTick.alignWithLabel).toBe(true);
    expect(option.series[0]).toMatchObject({ type: "bar", barWidth: "60%" });
    expect(option.series[0].label.formatter({ value: 12500 })).toBe("12,5 Mil");
    expect(option.series[0].data[0].itemStyle.color).not.toBe(option.series[0].data[1].itemStyle.color);
  });

  it("usa nomes municipais, ordem decrescente e gradiente no ranking de economia", () => {
    render(<PublicRankingChart title="Ranking da economia" values={[
      { posicao: 2, codigo_municipio: 3200201, nome_municipio: "Alegre", nome_patriarca: "Prefeitura de Alegre", economia_total_reais: "100.00" },
      { posicao: 1, codigo_municipio: 3200102, nome_municipio: "Afonso Cláudio", nome_patriarca: "Prefeitura de Afonso Cláudio", economia_total_reais: "200.00" },
    ]} />);
    const option = chartSetOption.mock.calls[0][0];
    expect(option.xAxis.max).toBe("dataMax");
    expect(option.yAxis.inverse).toBe(true);
    expect(option.yAxis.data).toEqual(["Afonso Cláudio", "Alegre"]);
    expect(option.series[0].data.map((item: { value: number }) => item.value)).toEqual([200, 100]);
    expect(option.series[0].data[0].itemStyle.color).not.toBe(option.series[0].data[1].itemStyle.color);
    expect(option.series[0]).toMatchObject({ type: "bar", realtimeSort: true, label: { show: true, valueAnimation: true } });
  });

  it("não apresenta o código IBGE como se fosse o nome municipal", () => {
    render(<PublicRankingChart title="Ranking da economia" values={[
      { posicao: 1, codigo_municipio: 3201100, nome_municipio: null, economia_total_reais: "100.00" },
    ]} />);
    const option = chartSetOption.mock.calls[0][0];
    expect(option.yAxis.data).toEqual(["Nome municipal indisponível"]);
    expect(option.yAxis.data).not.toContain("Município 3201100");
  });
});
