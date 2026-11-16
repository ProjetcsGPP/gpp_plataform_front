"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { PieChart, type PieSeriesOption } from "echarts/charts";
import {
  AriaComponent,
  LegendComponent,
  TooltipComponent,
  type AriaComponentOption,
  type LegendComponentOption,
  type TooltipComponentOption,
} from "echarts/components";
import { LabelLayout } from "echarts/features";
import { SVGRenderer } from "echarts/renderers";
import type { ComposeOption } from "echarts/core";

import { formatPercent } from "@/features/publicacoes/eflow/format";

type EflowChartOption = ComposeOption<
  PieSeriesOption | TooltipComponentOption | AriaComponentOption | LegendComponentOption
>;

export interface EflowDonutDatum {
  name: string;
  value: number;
  percentage: string;
}

const CHART_COLORS = [
  "#1d4ed8",
  "#0f766e",
  "#a16207",
  "#7e22ce",
  "#be123c",
  "#475569",
];

const PRESENTATION_COLORS = [
  "#93c5fd",
  "#60a5fa",
  "#0f4c81",
  "#3b9eea",
  "#1671bd",
  "#075985",
];

echarts.use([
  PieChart,
  TooltipComponent,
  LegendComponent,
  AriaComponent,
  LabelLayout,
  SVGRenderer,
]);

export function EflowDonutChart({
  ariaLabel,
  data,
  centerTotal,
  dark = false,
  presentation = false,
  legendFontSize = 12,
}: {
  ariaLabel: string;
  data: EflowDonutDatum[];
  centerTotal?: number;
  dark?: boolean;
  presentation?: boolean;
  legendFontSize?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || data.length === 0) return;

    const chart = echarts.init(container, dark ? "dark" : undefined, { renderer: "svg" });
    const reducedMotion = typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const option: EflowChartOption = {
      animation: !reducedMotion,
      color: presentation ? PRESENTATION_COLORS : CHART_COLORS,
      aria: {
        enabled: true,
        description: ariaLabel,
      },
      tooltip: {
        trigger: "item",
        formatter: (params) => {
          const currentParams = Array.isArray(params) ? params[0] : params;
          const item = data[currentParams?.dataIndex ?? -1];
          if (!item) return "";
          return `${escapeHtml(item.name)}: ${item.value.toLocaleString("pt-BR")} (${formatPercent(item.percentage)})`;
        },
      },
      legend: presentation
        ? {
            show: true,
            type: "scroll",
            orient: "horizontal",
            left: "center",
            bottom: 10,
            itemWidth: 11,
            itemHeight: 11,
            itemGap: 18,
            icon: "circle",
            textStyle: {
              color: dark ? "#e2e8f0" : "#0f172a",
              fontSize: legendFontSize,
              fontWeight: 600,
            },
          }
        : { show: false },
      series: [
        {
          type: "pie",
          radius: centerTotal === undefined
            ? ["0%", presentation ? "58%" : "60%"]
            : [presentation ? "35%" : "42%", presentation ? "58%" : "62%"],
          center: presentation ? ["50%", "43%"] : ["50%", "50%"],
          avoidLabelOverlap: true,
          minAngle: 2,
          itemStyle: {
            borderColor: dark ? "#0f172a" : "#ffffff",
            borderRadius: 4,
            borderWidth: 2,
          },
          label: {
            show: true,
            color: dark ? "#cbd5e1" : "#334155",
            fontSize: 11,
            lineHeight: 15,
            formatter: (params) => {
              const item = data[params.dataIndex];
              if (!item) return "";
              if (presentation) {
                return `{value|${item.value.toLocaleString("pt-BR")} (${formatPercent(item.percentage)})}`;
              }
              return `{name|${item.name}}\n{value|${item.value.toLocaleString("pt-BR")} (${formatPercent(item.percentage)})}`;
            },
            rich: {
              name: { color: dark ? "#f8fafc" : "#0f172a", fontWeight: 600 },
              value: {
                color: dark ? "#f8fafc" : "#0f172a",
                fontSize: presentation ? 14 : 11,
                fontWeight: presentation ? 700 : 400,
              },
            },
          },
          labelLine: {
            show: true,
            length: 10,
            length2: 8,
            lineStyle: { color: "#94a3b8" },
          },
          emphasis: {
            scaleSize: 6,
            itemStyle: {
              shadowBlur: 12,
              shadowColor: "rgba(15, 23, 42, 0.2)",
            },
          },
          data: data.map((item) => ({ name: item.name, value: item.value })),
        },
      ],
    };

    chart.setOption(option);

    const resize = () => chart.resize();
    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);

    if (resizeObserver) resizeObserver.observe(container);
    else window.addEventListener("resize", resize);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resize);
      chart.dispose();
    };
  }, [ariaLabel, centerTotal, dark, data, legendFontSize, presentation]);

  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-slate-500">
        Sem indicadores disponíveis.
      </div>
    );
  }

  return (
    <div className={`relative min-h-0 min-w-0 flex-1 ${presentation ? "h-full" : "h-72"}`}>
      <div ref={containerRef} className="size-full" />
      {centerTotal !== undefined && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center ${presentation ? "top-[43%] w-28" : "top-1/2 w-24"}`}
        >
          <strong className={`${presentation ? "text-3xl" : "text-2xl"} leading-none ${dark ? "text-slate-100" : "text-slate-900"}`}>
            {centerTotal.toLocaleString("pt-BR")}
          </strong>
          <span className={`mt-1 leading-tight ${presentation ? "text-sm" : "text-[10px]"} ${dark ? "text-slate-300" : "text-slate-600"}`}>
            Fluxos totais destes órgãos
          </span>
        </div>
      )}
    </div>
  );
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character,
  );
}
