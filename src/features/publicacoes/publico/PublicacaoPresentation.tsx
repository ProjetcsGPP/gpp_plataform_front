"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Banknote,
  Boxes,
  ChevronLeft,
  ChevronRight,
  CloudCog,
  Droplets,
  Expand,
  FileStack,
  FileText,
  Leaf,
  Moon,
  PackageOpen,
  Pause,
  Play,
  Printer,
  Recycle,
  Sun,
  Trees,
  type LucideIcon,
} from "lucide-react";

import { MapaMunicipalPublicacao } from "@/components/common/MapaMunicipalPublicacao";
import { Button } from "@/components/ui/button";
import { EflowDonutChart } from "@/features/publicacoes/eflow/EflowDonutChart";
import { mapasMunicipaisDoResultado, type MapaMunicipalCongelado } from "@/features/publicacoes/mapa/model";
import { debugLog } from "@/lib/debug";
import type {
  PublicEdocsContent,
  PublicEflowContent,
  PublicPublication,
  PublicSection,
} from "./model";
import { PublicRankingChart, PublicSeriesChart } from "./PublicSeriesChart";
import { formatPublicValue, latestAccumulatedValue } from "./presentationFormat";

const ENVIRONMENT_CODES = new Set(["ECONOMIA_PAPEL_KG", "GASES_POLUENTES_KG", "ECONOMIA_AGUA_M3"]);

interface EdocsMetricDefinition {
  code: string;
  label: string;
  icon: LucideIcon;
}

const EDOCS_METRIC_ROWS: readonly (readonly EdocsMetricDefinition[])[] = [
  [
    { code: "ECONOMIA_TOTAL_REAIS", label: "Economia total", icon: Banknote },
    { code: "TOTAL_PAGINAS", label: "Total de Páginas em PDF", icon: FileStack },
  ],
  [
    { code: "ECONOMIA_PAPEL_REAIS", label: "Economia de Papel", icon: Recycle },
    { code: "ECONOMIA_INSUMOS_REAIS", label: "Economia de Insumos", icon: PackageOpen },
    { code: "ECONOMIA_IMPRESSAO_REAIS", label: "Economia de Impressão", icon: Printer },
  ],
  [
    { code: "ECONOMIA_AGUA_M3", label: "Economia de Água", icon: Droplets },
    { code: "GASES_POLUENTES_KG", label: "Redução de CO₂", icon: CloudCog },
    { code: "ARVORES_SALVAS", label: "Árvores preservadas", icon: Trees },
  ],
  [
    { code: "TOTAL_PROCESSOS", label: "Total de Processos", icon: Boxes },
    { code: "TOTAL_DOCUMENTOS", label: "Total de Documentos", icon: FileText },
    { code: "ECONOMIA_PAPEL_KG", label: "Papel economizado", icon: Leaf },
  ],
];

type PresentationStep =
  | { key: string; title: string; kind: "edocs-totals" | "edocs-analysis"; section: PublicSection }
  | { key: string; title: string; kind: "edocs-map"; section: PublicSection; map: MapaMunicipalCongelado }
  | { key: string; title: string; kind: "eflow-charts" | "eflow-totals"; section: PublicSection }
  | { key: string; title: string; kind: "unsupported"; section: PublicSection };

export function PublicacaoPresentation({ publicacao, autoPlay = true, embedded = false, toolbarContent }: { publicacao: PublicPublication; autoPlay?: boolean; embedded?: boolean; toolbarContent?: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const inactivityTimerRef = useRef<number | null>(null);
  const sections = useMemo(() => [...publicacao.secoes].sort((a, b) => a.ordem - b.ordem), [publicacao.secoes]);
  const steps = useMemo(() => buildPresentationSteps(sections), [sections]);
  const [index, setIndex] = useState(0);
  const [dark, setDark] = useState(false);
  const reducedMotion = typeof window !== "undefined" && typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [playing, setPlaying] = useState(autoPlay && !reducedMotion);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current !== null) {
      window.clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  const scheduleControlsHide = useCallback(() => {
    clearInactivityTimer();
    inactivityTimerRef.current = window.setTimeout(() => {
      setControlsVisible(false);
    }, 5000);
  }, [clearInactivityTimer]);

  const showControlsTemporarily = useCallback(() => {
    setControlsVisible(true);
    scheduleControlsHide();
  }, [scheduleControlsHide]);

  useEffect(() => {
    if (!playing || steps.length < 2 || reducedMotion) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % steps.length), 12000);
    return () => window.clearInterval(timer);
  }, [playing, reducedMotion, steps.length]);
  useEffect(() => {
    const update = () => setFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);
  useEffect(() => {
    scheduleControlsHide();
    return clearInactivityTimer;
  }, [clearInactivityTimer, scheduleControlsHide]);
  useEffect(() => {
    window.addEventListener("keydown", showControlsTemporarily);
    return () => window.removeEventListener("keydown", showControlsTemporarily);
  }, [showControlsTemporarily]);

  function move(delta: number) {
    if (!steps.length) return;
    setIndex((current) => (current + delta + steps.length) % steps.length);
  }

  function keyboard(event: React.KeyboardEvent) {
    showControlsTemporarily();
    if (event.key === "ArrowRight") move(1);
    else if (event.key === "ArrowLeft") move(-1);
    else if (event.key === " ") { event.preventDefault(); setPlaying((value) => !value); }
    else if (event.key.toLowerCase() === "f") void containerRef.current?.requestFullscreen();
    else if (event.key.toLowerCase() === "d") setDark((value) => !value);
  }

  if (!steps.length) return <div className="rounded-2xl border border-dashed p-10 text-center text-slate-600">Esta publicação não possui seções disponíveis.</div>;
  const current = steps[Math.min(index, steps.length - 1)];
  const carouselRunning = playing && !reducedMotion && steps.length > 1;
  const shell = dark ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-950";
  const footer = dark ? "border-slate-700 bg-slate-900 text-slate-200" : "border-slate-200 bg-white text-slate-700";

  const presentationHeight = embedded
    ? "h-[calc(90dvh-5rem)] min-h-[32rem]"
    : "h-[calc(100dvh-7rem)] min-h-[32rem]";
  return <div ref={containerRef} tabIndex={0} onKeyDown={keyboard} onPointerMove={showControlsTemporarily} onPointerDown={showControlsTemporarily} data-theme={dark ? "dark" : "light"} className={`flex ${presentationHeight} flex-col overflow-hidden rounded-3xl shadow-2xl outline-none ring-sky-500 focus-visible:ring-2 ${shell} ${fullscreen ? "h-screen max-h-none min-h-0 rounded-none" : ""}`} aria-label="Apresentação da publicação">
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 bg-slate-950 px-5 py-3 text-white">
      <div><p className="text-xs uppercase tracking-[0.2em] text-sky-300">Publicações Institucionais</p><h1 className="text-xl font-bold">{publicacao.titulo}</h1><p className="text-xs text-slate-300">Competência {publicacao.competencia} · versão {publicacao.versao}</p></div>
      <div
        ref={controlsRef}
        data-testid="presentation-controls"
        data-visible={controlsVisible}
        className={`flex items-center gap-2 transition-opacity duration-300 ${controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onFocusCapture={showControlsTemporarily}
      >
        {toolbarContent}
        <Button variant="outline" size="icon" className="border-white/30 bg-transparent text-white hover:bg-white/10" onClick={() => move(-1)} aria-label="Etapa anterior"><ChevronLeft /></Button>
        <Button variant="outline" size="icon" className="border-white/30 bg-transparent text-white hover:bg-white/10" onClick={() => setPlaying((value) => !value)} aria-label={playing ? "Pausar apresentação" : "Retomar apresentação"}>{playing ? <Pause /> : <Play />}</Button>
        <Button variant="outline" size="icon" className="border-white/30 bg-transparent text-white hover:bg-white/10" onClick={() => setDark((value) => !value)} aria-label={dark ? "Usar tema claro" : "Usar tema escuro"}>{dark ? <Sun /> : <Moon />}</Button>
        <Button variant="outline" size="icon" className="border-white/30 bg-transparent text-white hover:bg-white/10" onClick={() => fullscreen ? document.exitFullscreen() : containerRef.current?.requestFullscreen()} aria-label={fullscreen ? "Sair da tela cheia" : "Exibir em tela cheia"}><Expand /></Button>
        <Button variant="outline" size="icon" className="border-white/30 bg-transparent text-white hover:bg-white/10" onClick={() => move(1)} aria-label="Próxima etapa"><ChevronRight /></Button>
      </div>
    </header>
    <div className="min-h-0 flex-1 overflow-hidden p-3 md:p-4" aria-live="polite"><StepPresentation step={current} dark={dark} /></div>
    {carouselRunning && <footer className={`flex shrink-0 items-center justify-between border-t px-5 py-2 text-sm ${footer}`}><span>{index + 1} de {steps.length}</span><div className="flex gap-2" aria-label="Selecionar etapa">{steps.map((step, position) => <button key={step.key} onClick={() => setIndex(position)} className={`h-2.5 rounded-full ${position === index ? "w-8 bg-sky-500" : dark ? "w-2.5 bg-slate-600" : "w-2.5 bg-slate-300"}`} aria-label={`Abrir etapa ${position + 1}: ${step.title}`} aria-current={position === index ? "step" : undefined} />)}</div><span className="hidden sm:inline">Reprodução automática</span></footer>}
  </div>;
}

function buildPresentationSteps(sections: PublicSection[]): PresentationStep[] {
  const edocs = sections.filter((section) => section.fonte === "EDOCS");
  const eflow = sections.filter((section) => section.fonte === "EFLOW");
  const unsupported = sections.filter((section) => section.fonte !== "EDOCS" && section.fonte !== "EFLOW");
  return [
    ...edocs.map((section) => ({ key: `edocs-totals-${section.ordem}`, title: "Resultado e-Docs nos Municípios: totalizadores", kind: "edocs-totals" as const, section })),
    ...edocs.map((section) => ({ key: `edocs-analysis-${section.ordem}`, title: `${section.titulo}: análises`, kind: "edocs-analysis" as const, section })),
    ...edocs.flatMap((section) => mapasMunicipaisDoResultado(section.conteudo as PublicEdocsContent).map((map, mapIndex) => ({ key: `edocs-map-${section.ordem}-${mapIndex}`, title: map.titulo, kind: "edocs-map" as const, section, map }))),
    ...eflow.map((section) => ({ key: `eflow-charts-${section.ordem}`, title: `${section.titulo}: gráficos`, kind: "eflow-charts" as const, section })),
    ...eflow.map((section) => ({ key: `eflow-totals-${section.ordem}`, title: `${section.titulo}: totalizadores`, kind: "eflow-totals" as const, section })),
    ...unsupported.map((section) => ({ key: `unsupported-${section.ordem}`, title: section.titulo, kind: "unsupported" as const, section })),
  ];
}

function StepPresentation({ step, dark }: { step: PresentationStep; dark: boolean }) {
  if (step.kind === "edocs-totals") return <EdocsTotals content={step.section.conteudo as PublicEdocsContent} dark={dark} />;
  if (step.kind === "edocs-analysis") return <EdocsAnalysis section={step.section} content={step.section.conteudo as PublicEdocsContent} dark={dark} />;
  if (step.kind === "edocs-map") return <MapStep section={step.section} map={step.map} dark={dark} />;
  if (step.kind === "eflow-charts") return <EflowCharts section={step.section} content={step.section.conteudo as PublicEflowContent} dark={dark} />;
  if (step.kind === "eflow-totals") return <EflowTotals section={step.section} content={step.section.conteudo as PublicEflowContent} dark={dark} />;
  debugLog("publicacoes", "seção pública ignorada por fonte desconhecida", { fonte: step.section.fonte, codigo: step.section.codigo });
  return <StepFrame eyebrow={String(step.section.fonte)} title={step.section.titulo} dark={dark}><div className={cardClass(dark, "p-6")}>Este tipo de seção ainda não possui apresentação visual compatível.</div></StepFrame>;
}

function StepFrame({ eyebrow, title, dark, children }: { eyebrow: string; title: string; dark: boolean; children: React.ReactNode }) {
  return <section data-theme={dark ? "dark" : "light"} className="flex h-full min-h-0 flex-col"><div className="mb-3 shrink-0"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-500">{eyebrow}</p><h2 className="text-2xl font-bold md:text-3xl">{title}</h2></div><div className="min-h-0 flex-1">{children}</div></section>;
}

function EdocsTotals({ content, dark }: { content: PublicEdocsContent; dark: boolean }) {
  const series = Array.isArray(content.series_historicas) ? content.series_historicas : [];
  const seriesByCode = new Map(series.map((item) => [item.codigo, item]));
  return <StepFrame eyebrow="E-Docs · visão geral" title="Resultado e-Docs nos Municípios" dark={dark}><div className="grid h-full min-h-0 grid-rows-[1.25fr_repeat(3,minmax(0,1fr))] gap-5">{EDOCS_METRIC_ROWS.map((row, rowIndex) => <div key={rowIndex} className={`grid min-h-0 gap-5 ${row.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>{row.map((definition) => {
    const item = seriesByCode.get(definition.code);
    return <Metric key={definition.code} label={definition.label} value={formatPublicValue(item ? latestAccumulatedValue(item.pontos) : null, item?.unidade, item?.precisao)} dark={dark} icon={definition.icon} featured={rowIndex === 0} />;
  })}</div>)}</div></StepFrame>;
}

function EdocsAnalysis({ section, content, dark }: { section: PublicSection; content: PublicEdocsContent; dark: boolean }) {
  const series = Array.isArray(content.series_historicas) ? content.series_historicas : [];
  const pages = series.filter((item) => item.codigo === "TOTAL_PAGINAS");
  const environmental = series.filter((item) => ENVIRONMENT_CODES.has(item.codigo));
  const ranking = Array.isArray(content.consolidados_historicos_patriarcas)
    ? content.consolidados_historicos_patriarcas
    : [];
  return <StepFrame eyebrow="E-Docs · evolução e economia" title={section.titulo} dark={dark}><div className="grid h-full min-h-0 grid-cols-1 grid-rows-3 gap-3 lg:grid-cols-12 lg:grid-rows-2">
    <div className="min-h-0 lg:col-span-8"><PublicSeriesChart title="Dados ambientais" series={environmental} kind="area-stack" dark={dark} compact /></div>
    <div className="min-h-0 lg:col-span-4 lg:row-span-2"><PublicRankingChart title="Ranking da economia" values={ranking} dark={dark} /></div>
    <div className="min-h-0 lg:col-span-8"><PublicSeriesChart title="Páginas por mês" series={pages} kind="bar-aligned" dark={dark} compact /></div>
  </div></StepFrame>;
}

function MapStep({ section, map, dark }: { section: PublicSection; map: MapaMunicipalCongelado; dark: boolean }) {
  return <StepFrame eyebrow="E-Docs · distribuição municipal" title={section.titulo} dark={dark}><MapaMunicipalPublicacao mapa={map} interativo dark={dark} compact presentationLayout /></StepFrame>;
}

function EflowCharts({ section, content, dark }: { section: PublicSection; content: PublicEflowContent; dark: boolean }) {
  const top = Array.isArray(content.orgaos_maior_quantidade_fluxos) ? content.orgaos_maior_quantidade_fluxos : [];
  const audience = Array.isArray(content.distribuicao_publico_alvo) ? content.distribuicao_publico_alvo : [];
  return <StepFrame eyebrow={`E-Flow · ${section.perfil_calculo}`} title={section.titulo} dark={dark}><div className="grid h-full min-h-0 gap-4 lg:grid-cols-2"><ChartCard title="Órgãos com mais fluxos" values={top.map((item) => ({ name: item.orgao, value: item.quantidade_fluxos, percentage: String(item.percentual) }))} dark={dark} /><ChartCard title="Distribuição por público-alvo" values={audience.map((item) => ({ name: item.publico_alvo, value: item.quantidade_fluxos, percentage: String(item.percentual) }))} dark={dark} /></div></StepFrame>;
}

function EflowTotals({ section, content, dark }: { section: PublicSection; content: PublicEflowContent; dark: boolean }) {
  return <StepFrame eyebrow={`E-Flow · ${section.perfil_calculo}`} title={section.titulo} dark={dark}><div className="grid h-full content-center gap-5 md:grid-cols-3"><Metric label="Total de fluxos" value={formatPublicValue(content.quantidade_fluxos)} dark={dark} icon={Boxes} featured /><Metric label="Órgãos participantes" value={formatPublicValue(content.quantidade_orgaos_participantes)} dark={dark} icon={FileText} featured /><Metric label="Setores ativos" value={formatPublicValue(content.quantidade_setores_ativos)} dark={dark} icon={Leaf} featured /></div></StepFrame>;
}

function cardClass(dark: boolean, extra = "") {
  return `rounded-2xl border ${dark ? "border-slate-700 bg-slate-900 text-slate-100 shadow-sm" : "border-slate-300 bg-white text-slate-950 shadow-md shadow-slate-300/50"} ${extra}`;
}

function Metric({ label, value, dark, icon: Icon, featured = false }: { label: string; value: string; dark: boolean; icon: LucideIcon; featured?: boolean }) {
  return <article className={cardClass(dark, "flex h-full min-h-0 flex-col overflow-hidden text-center")}><header className={`flex shrink-0 items-center justify-between gap-3 text-left text-white ${featured ? "min-h-16 px-5 py-3" : "min-h-14 px-4 py-2.5"} ${dark ? "bg-sky-900" : "bg-sky-800"}`}><span className={`font-semibold leading-tight ${featured ? "text-xl md:text-2xl" : "text-base md:text-lg xl:text-xl"}`}>{label}</span><Icon className={featured ? "h-9 w-9 md:h-11 md:w-11" : "h-7 w-7 md:h-8 md:w-8"} strokeWidth={1.8} aria-hidden="true" /></header><div className="flex min-h-0 flex-1 items-center justify-center px-3 py-1"><strong className={`leading-none tracking-tight ${featured ? "text-3xl md:text-4xl xl:text-5xl" : "text-xl md:text-2xl xl:text-3xl"}`}>{value}</strong></div></article>;
}

function ChartCard({ title, values, dark }: { title: string; values: Array<{ name: string; value: number; percentage: string }>; dark: boolean }) {
  return <section className={cardClass(dark, "flex min-h-0 flex-col overflow-hidden")}><h3 className={`flex min-h-14 shrink-0 items-center px-4 py-2.5 text-base font-semibold leading-tight text-white md:text-lg xl:text-xl ${dark ? "bg-sky-900" : "bg-sky-800"}`}>{title}</h3><div className="min-h-0 flex-1 p-3"><EflowDonutChart ariaLabel={title} data={values} dark={dark} /></div></section>;
}

export function adaptAdministrativePublication(publication: { id: string; versao: number; titulo: string; competencia: string; publicada_em: string | null; atualizado_em: string; secoes: Array<{ ordem: number; titulo: string; fonte: "EDOCS" | "EFLOW"; perfil_calculo: string; configuracao_congelada: Record<string, unknown>; resultado: Record<string, unknown> }> }): PublicPublication {
  return { id: publication.id, versao: publication.versao, titulo: publication.titulo, competencia: publication.competencia, publicada_em: publication.publicada_em ?? publication.atualizado_em, schema_version: "1.0", secoes: publication.secoes.map((section) => ({ ordem: section.ordem, codigo: typeof section.configuracao_congelada.codigo === "string" ? section.configuracao_congelada.codigo : null, titulo: section.titulo, fonte: section.fonte, perfil_calculo: section.perfil_calculo, conteudo: section.resultado })) };
}
