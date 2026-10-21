"use client";

import { useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { ArrowLeft, ChevronDown, ChevronUp, Maximize2, Minimize2, RefreshCw } from "lucide-react";

import { AdminAlert } from "@/components/admin/AdminPage";
import { Button } from "@/components/ui/button";
import { getImportacao, getRelatorioImportacao, importacaoKey, processoAtivoKey } from "@/features/carga-org-lot/api";
import { LotacaoReviewWorkspace } from "@/features/carga-org-lot/LotacaoReviewWorkspace";
import type { ImportacaoPlanilha } from "@/features/carga-org-lot/model";
import { formatOrganogramaValidationMessage } from "@/features/carga-org-lot/validationMessages";
import { formatAdminDate } from "@/lib/adminResource";
import { getApiErrorMessage } from "@/lib/apiErrors";

export function RelatorioValidacaoPanel({ importacao, organograma = null, onClose, onRefresh }: {
  importacao: ImportacaoPlanilha;
  organograma?: ImportacaoPlanilha | null;
  onClose: () => void;
  onRefresh?: () => Promise<unknown>;
}) {
  const { mutate: mutateCache } = useSWRConfig();
  const { data, error, isLoading, mutate } = useSWR(
    ["carga-org-lot:relatorio-importacao", importacao.idimportacaoplanilha],
    () => getRelatorioImportacao(importacao.idimportacaoplanilha),
    { revalidateOnFocus: false },
  );
  const { data: refreshedImportacao, mutate: mutateImportacao } = useSWR(
    importacaoKey(importacao.idimportacaoplanilha),
    () => getImportacao(importacao.idimportacaoplanilha),
    { fallbackData: importacao, revalidateOnFocus: false },
  );
  const [severity, setSeverity] = useState("");
  const [sheet, setSheet] = useState("");
  const [code, setCode] = useState("");
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [tableMaximized, setTableMaximized] = useState(false);
  const isLotation = importacao.idtipocarga_id === 4 || importacao.idtipocarga_id === 5;
  const [activeView, setActiveView] = useState<"OCCURRENCES" | "REVIEW">(
    isLotation ? "REVIEW" : "OCCURRENCES",
  );
  const sheets = useMemo(() => [...new Set(data?.ocorrencias.map((item) => item.straba).filter(Boolean) ?? [])].sort(), [data]);
  const codes = useMemo(() => [...new Set(data?.ocorrencias.map((item) => item.strcodigo).filter(Boolean) ?? [])].sort(), [data]);
  const occurrences = useMemo(() => data?.ocorrencias.filter((item) => (!severity || item.strseveridade === severity) && (!sheet || item.straba === sheet) && (!code || item.strcodigo === code)) ?? [], [code, data, severity, sheet]);
  const organogramName = importacao.idimportacaoorganograma_id
    ? organograma?.strreferencia || organograma?.strnomearquivo || `Organograma #${importacao.idimportacaoorganograma_id}`
    : null;
  const currentImportacao = refreshedImportacao ?? importacao;
  const treatmentCompleted = (
    currentImportacao.strstatusimportacao === "PRONTA_PARA_INCORPORAR"
    || currentImportacao.strstatusimportacao === "INCORPORADA"
  ) && data?.strresultado === "INVALIDO";
  const reviewLabel = currentImportacao.strstatusimportacao === "PRONTA_PARA_INCORPORAR"
    ? "Revisão e incorporação"
    : currentImportacao.strstatusimportacao === "INCORPORADA"
      ? "Tratamento realizado"
      : "Revisar casos";

  async function refreshReview() {
    await Promise.all([
      mutate(),
      mutateImportacao(),
      onRefresh?.(),
      mutateCache(processoAtivoKey(importacao.idpatriarca_id)),
    ]);
  }

  return (
    <section className="flex h-[calc(100dvh-15rem)] min-h-0 w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" role="region" aria-labelledby="persistent-report-title">
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-4 py-3">
        <div>
          <h2 id="persistent-report-title" className="text-lg font-bold text-slate-900">Relatório de validação</h2>
          <p className="text-sm text-slate-600">{importacao.strnomearquivo} · importação #{importacao.idimportacaoplanilha}</p>
          {organogramName && <p className="mt-0.5 text-xs font-medium text-app-primary">Organograma: {organogramName}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={onClose} aria-label="Voltar à lista de arquivos"><ArrowLeft /> Voltar aos arquivos</Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-4">
        {isLoading ? <p className="py-16 text-center text-sm text-slate-500">Carregando relatório...</p> : error ? (
          <AdminAlert><div className="flex items-center justify-between gap-3"><span>{getApiErrorMessage(error, "Não foi possível carregar o relatório de validação.")}</span><Button size="sm" variant="outline" onClick={() => mutate()}><RefreshCw /> Tentar novamente</Button></div></AdminAlert>
        ) : data ? <>
          {!tableMaximized && (
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <StatusResult code={data.strresultado} label={`${treatmentCompleted ? "Validação original: " : ""}${data.resultado_nome}`} />
              {treatmentCompleted && (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                  {currentImportacao.strstatusimportacao === "INCORPORADA" ? "Incorporada após tratamento" : "Críticas tratadas · pronta para incorporar"}
                </span>
              )}
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${data.flgleituracompleta ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>Leitura {data.flgleituracompleta ? "completa" : "incompleta"}</span>
              <p className="text-xs text-slate-500">Processado em {formatAdminDate(data.datprocessamento)} · regras {data.strversaoregras}</p>
              <dl className="ml-auto flex flex-wrap gap-2">
                <Summary label="Linhas" value={data.inttotallinhas} />
                <Summary label="Válidas" value={data.inttotalvalidas} />
                <Summary label="Erros" value={data.inttotalerros} tone="error" />
                <Summary label="Avisos" value={data.inttotalavisos} tone="warning" />
              </dl>
            </div>
          )}

            {isLotation && (
              <div className="flex shrink-0 gap-2 border-b border-slate-200 pb-2">
                <Button variant={activeView === "REVIEW" ? "default" : "outline"} size="sm" onClick={() => setActiveView("REVIEW")}>{reviewLabel} ({data.casos?.length ?? 0})</Button>
                <Button variant={activeView === "OCCURRENCES" ? "default" : "outline"} size="sm" onClick={() => setActiveView("OCCURRENCES")}>Todas as ocorrências ({data.ocorrencias.length})</Button>
              </div>
            )}

            {(!isLotation || activeView === "OCCURRENCES") && <>
            <section className="shrink-0 rounded-lg border border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between gap-3 px-3 py-2">
              <div><h3 className="text-sm font-semibold text-slate-900">Filtros das críticas</h3><p className="text-xs text-slate-500">{occurrences.length} de {data.ocorrencias.length} ocorrências exibidas</p></div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => setFiltersExpanded((current) => !current)} aria-expanded={filtersExpanded && !tableMaximized}>
                  {filtersExpanded && !tableMaximized ? <ChevronUp /> : <ChevronDown />}{filtersExpanded && !tableMaximized ? "Recolher filtros" : "Exibir filtros"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setTableMaximized((current) => !current)} aria-pressed={tableMaximized}>
                  {tableMaximized ? <Minimize2 /> : <Maximize2 />}{tableMaximized ? "Restaurar relatório" : "Maximizar críticas"}
                </Button>
              </div>
            </div>
            {filtersExpanded && !tableMaximized && (
              <div className="grid gap-3 border-t border-slate-200 p-3 md:grid-cols-3">
                <Filter label="Severidade" value={severity} onChange={setSeverity}><option value="">Todas</option><option value="ERRO">Erro</option><option value="AVISO">Aviso</option><option value="INFORMACAO">Informação</option><option value="NORMALIZACAO">Normalização</option></Filter>
                <Filter label="Aba" value={sheet} onChange={setSheet}><option value="">Todas</option>{sheets.map((value) => <option key={value}>{value}</option>)}</Filter>
                <Filter label="Código" value={code} onChange={setCode}><option value="">Todos</option>{codes.map((value) => <option key={value}>{value}</option>)}</Filter>
              </div>
            )}
            </section>

            <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[76rem] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-100 text-xs uppercase text-slate-600"><tr><th className="px-3 py-2">Severidade</th><th className="px-3 py-2">Aba</th><th className="px-3 py-2">Linha</th><th className="px-3 py-2">Campo</th><th className="px-3 py-2">Código</th><th className="px-3 py-2">Mensagem</th><th className="px-3 py-2">Valor original</th><th className="px-3 py-2">Valor normalizado</th><th className="px-3 py-2">Sugestões</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {occurrences.map((item) => <tr key={item.idocorrenciavalidacao} className="align-top"><td className="px-3 py-2"><Severity code={item.strseveridade} label={item.severidade_nome} /></td><td className="px-3 py-2">{item.straba || "—"}</td><td className="px-3 py-2">{item.intlinha ?? "—"}</td><td className="px-3 py-2">{item.strcampo || "—"}</td><td className="px-3 py-2 font-mono text-xs">{item.strcodigo}</td><td className="max-w-sm px-3 py-2">{formatOrganogramaValidationMessage(item.strcodigo, item.strmensagem)}</td><td className="max-w-xs break-words px-3 py-2">{item.strvalororiginal || "—"}</td><td className="max-w-xs break-words px-3 py-2">{item.strvalornormalizado || "—"}</td><td className="max-w-xs px-3 py-2">{formatSuggestions(item.jsonsugestoes)}</td></tr>)}
              </tbody>
            </table>
              {!occurrences.length && <p className="p-8 text-center text-sm text-slate-500">Nenhuma ocorrência encontrada para os filtros selecionados.</p>}
            </div>
            </>}
            {isLotation && activeView === "REVIEW" && (
              <LotacaoReviewWorkspace
                importacao={currentImportacao}
                report={data}
                onRefresh={refreshReview}
              />
            )}
        </> : null}
      </div>
    </section>
  );
}

function Summary({ label, value, tone }: { label: string; value: number; tone?: "error" | "warning" }) {
  const color = tone === "error" ? "text-red-700" : tone === "warning" ? "text-amber-700" : "text-slate-900";
  return <div className="flex items-baseline gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1"><dt className="text-xs text-slate-500">{label}</dt><dd className={`font-bold ${color}`}>{value}</dd></div>;
}

function Filter({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label className="text-xs font-medium text-slate-600">{label}<select className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" value={value} onChange={(event) => onChange(event.target.value)}>{children}</select></label>;
}

function StatusResult({ code, label }: { code: string; label: string }) {
  const color = code === "VALIDO" ? "bg-emerald-100 text-emerald-800" : code === "INVALIDO" ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-900";
  return <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${color}`}>{label}</span>;
}

function Severity({ code, label }: { code: string; label: string }) {
  const color = code === "ERRO" ? "bg-red-100 text-red-800" : code === "AVISO" ? "bg-amber-100 text-amber-900" : code === "NORMALIZACAO" ? "bg-violet-100 text-violet-800" : "bg-blue-100 text-blue-800";
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${color}`}>{label}</span>;
}

function formatSuggestions(values: unknown[]) {
  if (!values.length) return "—";
  return values.map((value) => typeof value === "string" ? value : JSON.stringify(value)).join("; ");
}
