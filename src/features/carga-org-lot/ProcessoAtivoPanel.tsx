"use client";

import useSWR from "swr";
import { AlertTriangle, Clock3, RefreshCw } from "lucide-react";

import { AdminAlert, AdminPanel } from "@/components/admin/AdminPage";
import { Button } from "@/components/ui/button";
import {
  listProcessosCargaInicial,
  processoAtivoKey,
} from "@/features/carga-org-lot/api";
import { formatAdminDate } from "@/lib/adminResource";
import { getApiErrorMessage } from "@/lib/apiErrors";

export function ProcessoAtivoPanel({ patriarcaId }: { patriarcaId: number }) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    processoAtivoKey(patriarcaId),
    () => listProcessosCargaInicial(patriarcaId),
  );
  const processo = data?.results[0] ?? null;

  if (isLoading) {
    return <AdminPanel className="p-6 text-sm text-slate-500">Carregando processo ativo...</AdminPanel>;
  }
  if (error) {
    return <AdminAlert><div className="flex items-center justify-between gap-3"><span>{getApiErrorMessage(error, "Não foi possível carregar o processo ativo.")}</span><Button size="sm" variant="outline" onClick={() => mutate()}><RefreshCw /> Tentar novamente</Button></div></AdminAlert>;
  }
  if (!processo) {
    return <AdminPanel className="p-6"><h2 className="font-semibold text-slate-900">Processo inicial</h2><p className="mt-1 text-sm text-slate-600">O processo deste patriarca ainda não foi iniciado.</p></AdminPanel>;
  }

  return (
    <div className="space-y-5" aria-busy={isValidating}>
      {processo.strstatuslotacao === "DESATUALIZADA" && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950" role="status">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div><p className="font-semibold">Lotações desatualizadas</p><p className="text-sm">Um novo organograma foi incorporado depois das lotações existentes. Revise e importe novamente as lotações.</p></div>
        </div>
      )}

      <AdminPanel>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div><h2 className="font-semibold text-slate-900">Processo de carga inicial</h2><p className="text-xs text-slate-500">Aberto em {formatAdminDate(processo.databertura)}</p></div>
          <StatusPill code={processo.strfaseatual} label={processo.fase_nome} />
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-3">
          <ProcessStatus title="Fase atual" code={processo.strfaseatual} label={processo.fase_nome} />
          <ProcessStatus title="Organograma" code={processo.strstatusorganograma} label={processo.status_organograma_nome} />
          <ProcessStatus title="Lotações" code={processo.strstatuslotacao} label={processo.status_lotacao_nome} />
        </div>
      </AdminPanel>

      <AdminPanel>
        <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold text-slate-900">Histórico de transições</h2></div>
        {processo.historico.length ? (
          <ol className="divide-y divide-slate-100">
            {processo.historico.map((entry) => (
              <li key={entry.idhistoricoprocesso} className="grid gap-2 px-5 py-4 md:grid-cols-[11rem_1fr]">
                <div className="flex gap-2 text-xs text-slate-500"><Clock3 className="size-4" aria-hidden="true" /><span>{formatAdminDate(entry.created_at)}<span className="block">{entry.created_by_name || "Sistema"}</span></span></div>
                <div><p className="font-medium text-slate-900">{entry.strmensagem || humanizeCode(entry.stracao)}</p><p className="mt-1 text-xs text-slate-600">Fase: {transition(entry.strfaseanterior, entry.strfasenova)} · Organograma: {transition(entry.strstatusorganogramaanterior, entry.strstatusorganogramanovo)} · Lotações: {transition(entry.strstatuslotacaoanterior, entry.strstatuslotacaonovo)}</p></div>
              </li>
            ))}
          </ol>
        ) : <p className="p-6 text-sm text-slate-500">Nenhuma transição registrada.</p>}
      </AdminPanel>
    </div>
  );
}

function ProcessStatus({ title, code, label }: { title: string; code: string; label: string }) {
  return <div className="rounded-lg border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p><div className="mt-2"><StatusPill code={code} label={label} /></div>{code === "NOVO" && <p className="mt-2 text-xs text-slate-500">Processo ainda não iniciado.</p>}</div>;
}

function StatusPill({ code, label }: { code: string; label: string }) {
  const tone = ["ERRO", "ERRO_PROCESSAMENTO", "COM_PENDENCIAS"].includes(code)
    ? "bg-red-100 text-red-800"
    : code === "DESATUALIZADA"
      ? "bg-amber-100 text-amber-900"
      : ["PRONTO", "PRONTA", "CONCLUIDO", "CONCLUIDA"].includes(code)
        ? "bg-emerald-100 text-emerald-800"
        : "bg-blue-100 text-blue-800";
  return <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${tone}`}>{label}</span>;
}

function transition(from: string, to: string) {
  if (!from || from === to) return humanizeCode(to);
  return `${humanizeCode(from)} → ${humanizeCode(to)}`;
}

function humanizeCode(value: string) {
  if (!value) return "—";
  const text = value.toLowerCase().replaceAll("_", " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}
