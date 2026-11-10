"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { PieChart, type PieSeriesOption } from "echarts/charts";
import {
  AriaComponent,
  TooltipComponent,
  type AriaComponentOption,
  type TooltipComponentOption,
} from "echarts/components";
import { LabelLayout } from "echarts/features";
import { SVGRenderer } from "echarts/renderers";
import type { ComposeOption } from "echarts/core";

import { formatPercent } from "@/features/publicacoes/eflow/format";

type EflowChartOption = ComposeOption<
  PieSeriesOption | TooltipComponentOption | AriaComponentOption
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

echarts.use([
  PieChart,
  TooltipComponent,
  AriaComponent,
  LabelLayout,
  SVGRenderer,
]);

export function EflowDonutChart({
  ariaLabel,
  data,
  centerTotal,
}: {
  ariaLabel: string;
  data: EflowDonutDatum[];
  centerTotal?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || data.length === 0) return;

    const chart = echarts.init(container, null, { renderer: "svg" });
    const option: EflowChartOption = {
      color: CHART_COLORS,
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
      series: [
        {
          type: "pie",
          radius: centerTotal === undefined ? ["0%", "60%"] : ["42%", "62%"],
          center: ["50%", "50%"],
          avoidLabelOverlap: true,
          minAngle: 2,
          itemStyle: {
            borderColor: "#ffffff",
            borderRadius: 4,
            borderWidth: 2,
          },
          label: {
            show: true,
            color: "#334155",
            fontSize: 11,
            lineHeight: 15,
            formatter: (params) => {
              const item = data[params.dataIndex];
              if (!item) return "";
              return `{name|${item.name}}\n{value|${item.value.toLocaleString("pt-BR")} (${formatPercent(item.percentage)})}`;
            },
            rich: {
              name: { color: "#0f172a", fontWeight: 600 },
              value: { color: "#475569" },
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
  }, [ariaLabel, centerTotal, data]);

  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-slate-500">
        Sem indicadores disponíveis.
      </div>
    );
  }

  return (
    <div className="relative h-72 min-w-0 flex-1">
      <div ref={containerRef} className="size-full" />
      {centerTotal !== undefined && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 flex w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center"
        >
          <strong className="text-2xl leading-none text-slate-900">
            {centerTotal.toLocaleString("pt-BR")}
          </strong>
          <span className="mt-1 text-[10px] leading-tight text-slate-600">
            Fluxos destes órgãos
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
