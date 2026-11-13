"use client";

import { useEffect, useMemo, useRef } from "react";
import * as echarts from "echarts/core";
import { BarChart, LineChart, type BarSeriesOption, type LineSeriesOption } from "echarts/charts";
import {
  AriaComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  type AriaComponentOption,
  type GridComponentOption,
  type LegendComponentOption,
  type TooltipComponentOption,
} from "echarts/components";
import { SVGRenderer } from "echarts/renderers";
import type { ComposeOption } from "echarts/core";

import type { PublicSeries, PublicValue } from "./model";
import { formatPublicValue } from "./presentationFormat";

type ChartOption = ComposeOption<
  | LineSeriesOption
  | BarSeriesOption
  | AriaComponentOption
  | GridComponentOption
  | LegendComponentOption
  | TooltipComponentOption
>;

type SeriesChartKind = "line" | "bar" | "area-stack" | "bar-aligned";

const MONTH_NAMES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

const ENVIRONMENT_COLORS: Record<string, string> = {
  ECONOMIA_AGUA_M3: "#93c5fd",
  ECONOMIA_PAPEL_KG: "#3b82f6",
  GASES_POLUENTES_KG: "#1e3a8a",
};

function monthName(competency: string) {
  const month = Number(competency.slice(5, 7));
  return MONTH_NAMES[month - 1] ?? competency;
}

function mixHex(start: string, end: string, ratio: number) {
  const parse = (color: string) => [1, 3, 5].map((offset) => Number.parseInt(color.slice(offset, offset + 2), 16));
  const from = parse(start);
  const to = parse(end);
  return `#${from.map((value, index) => Math.round(value + ((to[index] ?? value) - value) * ratio).toString(16).padStart(2, "0")).join("")}`;
}

function gradientColors(length: number, start: string, end: string) {
  return Array.from({ length }, (_, index) => mixHex(start, end, length <= 1 ? 1 : index / (length - 1)));
}

function formatThousands(value: number) {
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value / 1000)} Mil`;
}

function municipalityName(item: Record<string, PublicValue>) {
  if (item.nome_municipio) return String(item.nome_municipio);
  return "Nome municipal indisponível";
}

echarts.use([LineChart, BarChart, AriaComponent, GridComponent, LegendComponent, TooltipComponent, SVGRenderer]);

export function PublicSeriesChart({ title, series, kind = "line", dark = false, compact = false }: { title: string; series: PublicSeries[]; kind?: SeriesChartKind; dark?: boolean; compact?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container || !series.length) return;
    const reducedMotion = typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const chart = echarts.init(container, dark ? "dark" : undefined, { renderer: "svg" });
    const competencies = series[0]?.pontos.map((point) => point.competencia) ?? [];
    const isBar = kind === "bar" || kind === "bar-aligned";
    const isArea = kind === "area-stack";
    const axisColor = dark ? "#94a3b8" : "#64748b";
    const splitColor = dark ? "#334155" : "#e2e8f0";
    const yearLineColor = dark ? "#f8fafc" : "#334155";
    const pageColors = gradientColors(competencies.length, "#bae6fd", "#075985");
    const yearMarkers = competencies
      .filter((competency, index) => index === 0 || competency.endsWith("-01"))
      .map((competency) => ({ name: competency.slice(0, 4), xAxis: competency }));
    const option: ChartOption = {
      animation: !reducedMotion,
      backgroundColor: "transparent",
      aria: { enabled: true, description: title },
      color: series.map((item) => ENVIRONMENT_COLORS[item.codigo] ?? "#38bdf8"),
      grid: { left: 58, right: 18, top: series.length > 1 ? 45 : 30, bottom: 92 },
      legend: { show: series.length > 1, top: 0, textStyle: { color: axisColor } },
      tooltip: {
        trigger: "axis",
        axisPointer: isArea ? { type: "cross", label: { backgroundColor: "#475569" } } : { type: "shadow" },
      },
      xAxis: {
        type: "category",
        data: competencies,
        boundaryGap: !isArea,
        axisTick: { alignWithLabel: kind === "bar-aligned" },
        axisLine: { lineStyle: { color: axisColor } },
        axisLabel: { color: axisColor, rotate: 90, margin: 14, formatter: (value: string) => monthName(value) },
        splitLine: {
          show: true,
          interval: (_index: number, value: string) => value.endsWith("-01"),
          lineStyle: { color: yearLineColor, width: 2, type: "solid" },
        },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: axisColor },
        splitLine: { lineStyle: { color: splitColor, type: "dashed" } },
      },
      series: series.map((item, seriesIndex) => {
        const color = ENVIRONMENT_COLORS[item.codigo];
        return {
          name: item.titulo,
          type: isBar ? "bar" : "line",
          stack: isArea ? "ambiental" : undefined,
          areaStyle: isArea ? { opacity: 0.55, color } : undefined,
          lineStyle: color ? { color, width: 2 } : undefined,
          itemStyle: color ? { color } : undefined,
          emphasis: isArea ? { focus: "series" } : undefined,
          barWidth: kind === "bar-aligned" ? "60%" : undefined,
          smooth: !isBar && !reducedMotion,
          showSymbol: !isArea,
          connectNulls: false,
          label: kind === "bar-aligned" ? {
            show: true,
            position: "top",
            color: axisColor,
            formatter: (params) => formatThousands(Number(params.value ?? 0)),
          } : undefined,
          markLine: seriesIndex === 0 ? {
            silent: true,
            symbol: ["none", "none"],
            lineStyle: { color: yearLineColor, width: 2, type: "solid" },
            label: { show: true, position: "insideEndTop", color: yearLineColor, fontWeight: "bold" },
            data: yearMarkers,
          } : undefined,
          data: item.pontos.map((point, index) => {
            const value = point.valor === null ? null : Number(point.valor);
            return kind === "bar-aligned" && value !== null
              ? { value, itemStyle: { color: pageColors[index] } }
              : value;
          }),
        };
      }),
    };
    chart.setOption(option);
    const resize = () => chart.resize();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    observer?.observe(container);
    if (!observer) window.addEventListener("resize", resize);
    return () => { observer?.disconnect(); window.removeEventListener("resize", resize); chart.dispose(); };
  }, [dark, kind, series, title]);

  if (!series.length) return <EmptyChart title={title} dark={dark} />;
  const competencies = series[0]?.pontos.map((point) => point.competencia) ?? [];
  return <section className={chartCardClass(dark)}>
    <ChartHeader title={title} dark={dark} />
    <div ref={ref} className={`mx-3 mt-2 min-h-0 flex-1 ${compact ? "mb-3 h-full" : "h-80"}`} aria-hidden="true" />
    {compact ? <SeriesTable series={series} competencies={competencies} hidden /> : <details className="mx-3 mb-3 mt-2 text-sm"><summary className={`cursor-pointer font-medium ${dark ? "text-slate-300" : "text-slate-700"}`}>Consultar dados do gráfico em tabela</summary><SeriesTable series={series} competencies={competencies} /></details>}
  </section>;
}

export function PublicRankingChart({ title, values, dark = false }: { title: string; values: Array<Record<string, PublicValue>>; dark?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const orderedValues = useMemo(
    () => [...values]
      .sort((left, right) => Number(right.economia_total_reais ?? 0) - Number(left.economia_total_reais ?? 0))
      .slice(0, 10),
    [values],
  );
  useEffect(() => {
    const container = ref.current;
    if (!container || !orderedValues.length) return;
    const reducedMotion = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const chart = echarts.init(container, dark ? "dark" : undefined, { renderer: "svg" });
    const names = orderedValues.map(municipalityName);
    const rankingColors = gradientColors(orderedValues.length, "#075985", "#bae6fd");
    const axisColor = dark ? "#94a3b8" : "#64748b";
    const option: ChartOption = {
      animation: !reducedMotion,
      animationDuration: 0,
      animationDurationUpdate: reducedMotion ? 0 : 600,
      animationEasingUpdate: "linear",
      backgroundColor: "transparent",
      aria: { enabled: true, description: title },
      grid: { left: 12, right: 72, top: 12, bottom: 20, containLabel: true },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      xAxis: { type: "value", max: "dataMax", axisLabel: { color: axisColor }, splitLine: { show: false } },
      yAxis: { type: "category", data: names, inverse: true, animationDuration: 300, animationDurationUpdate: 300, axisLabel: { color: axisColor, width: 115, overflow: "truncate" }, axisTick: { show: false }, axisLine: { show: false } },
      series: [{
        name: "Economia total",
        type: "bar",
        realtimeSort: !reducedMotion,
        data: orderedValues.map((item, index) => ({ value: Number(item.economia_total_reais ?? 0), itemStyle: { color: rankingColors[index], borderRadius: [0, 6, 6, 0] } })),
        label: { show: true, position: "right", valueAnimation: !reducedMotion, color: axisColor, formatter: (params) => formatPublicValue(Number(params.value ?? 0), "BRL", 2) },
      }],
    };
    chart.setOption(option);
    const resize = () => chart.resize();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    observer?.observe(container);
    if (!observer) window.addEventListener("resize", resize);
    return () => { observer?.disconnect(); window.removeEventListener("resize", resize); chart.dispose(); };
  }, [dark, orderedValues, title]);
  if (!orderedValues.length) return <EmptyChart title={title} dark={dark} />;
  return <section className={chartCardClass(dark)}><ChartHeader title={title} dark={dark} /><div ref={ref} className="mx-3 mb-3 mt-2 min-h-0 flex-1" aria-hidden="true" /><table className="sr-only"><caption>{title}</caption><tbody>{orderedValues.map((item) => <tr key={`${item.posicao}-${item.codigo_municipio}`}><td>{municipalityName(item)}</td><td>{formatPublicValue(item.economia_total_reais, "BRL", 2)}</td></tr>)}</tbody></table></section>;
}

function chartCardClass(dark: boolean) {
  return `flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border ${dark ? "border-slate-700 bg-slate-900 text-slate-100 shadow-sm" : "border-slate-300 bg-white text-slate-950 shadow-md shadow-slate-300/50"}`;
}

function ChartHeader({ title, dark }: { title: string; dark: boolean }) {
  return <h3 className={`flex min-h-14 shrink-0 items-center px-4 py-2.5 text-base font-semibold leading-tight text-white md:text-lg xl:text-xl ${dark ? "bg-sky-900" : "bg-sky-800"}`}>{title}</h3>;
}

function EmptyChart({ title, dark }: { title: string; dark: boolean }) {
  return <section className={`${chartCardClass(dark)} text-sm`}><ChartHeader title={title} dark={dark} /><div className="flex min-h-0 flex-1 items-center justify-center p-4"><span className={dark ? "text-slate-400" : "text-slate-500"}>Sem dados disponíveis.</span></div></section>;
}

function SeriesTable({ series, competencies, hidden = false }: { series: PublicSeries[]; competencies: string[]; hidden?: boolean }) {
  return <div className={hidden ? "sr-only" : "mt-2 max-h-72 overflow-auto"}><table className="w-full text-left text-xs"><thead><tr><th className="p-2">Competência</th>{series.map((item) => <th className="p-2" key={item.codigo}>{item.titulo}</th>)}</tr></thead><tbody>{competencies.map((competency, index) => <tr className="border-t" key={competency}><td className="p-2">{competency}</td>{series.map((item) => <td className="p-2" key={item.codigo}>{formatPublicValue(item.pontos[index]?.valor ?? null, item.unidade, item.precisao)}</td>)}</tr>)}</tbody></table></div>;
}
