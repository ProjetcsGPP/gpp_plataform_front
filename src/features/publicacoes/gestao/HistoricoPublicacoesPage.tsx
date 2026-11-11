"use client";

import { useState } from "react";
import useSWR from "swr";
import { AdminAlert, AdminPanel } from "@/components/admin/AdminPage";
import { AdminLoading } from "@/components/admin/AdminLoading";
import { RouteGuard } from "@/components/common/RouteGuard";
import { EdocsPage } from "@/features/publicacoes/edocs/EdocsUi";
import { formatAdminDate } from "@/lib/adminResource";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { PERMISSIONS } from "@/lib/permissions";
import { listHistorico, listPublicacoes } from "./api";
import { publicacoesCacheKeys } from "./cache";
import { SITUACAO_LABELS } from "./format";
import type { SituacaoPublicacao } from "./model";

export function HistoricoPublicacoesPage() {
  const [selected, setSelected] = useState("");
  const { data: publications, error: publicationsError } = useSWR(publicacoesCacheKeys.list(["history-selector"]), () => listPublicacoes({ page: 1, page_size: 200, ordering: "-criado_em" }), { revalidateOnFocus: false });
  const { data, error, isLoading, mutate } = useSWR(selected ? publicacoesCacheKeys.history(selected) : null, () => listHistorico(selected), { revalidateOnFocus: false });
  return <RouteGuard permission={PERMISSIONS.PUBLICACAO_HISTORICO_VIEW} loadingFallback={<AdminLoading label="Verificando acesso ao histórico..." />}><EdocsPage title="Histórico de publicações" description="Trilha de auditoria somente leitura e append-only das transições editoriais.">
    <label className="block max-w-2xl text-sm font-medium">Publicação<select className="mt-1 block w-full rounded-md border border-slate-300 bg-white p-2" value={selected} onChange={event => setSelected(event.target.value)}><option value="">Selecione uma publicação</option>{publications?.results.map(item => <option key={item.id} value={item.id}>{item.competencia} · v{item.versao} · {item.titulo}</option>)}</select></label>
    {publicationsError && <div className="mt-4"><AdminAlert>{getApiErrorMessage(publicationsError, "Não foi possível carregar as publicações.")}</AdminAlert></div>}
    {!selected && <p className="mt-8 rounded-lg border border-dashed p-8 text-center text-sm text-slate-500">Selecione uma publicação para consultar seus eventos.</p>}
    {selected && isLoading && <AdminLoading label="Carregando eventos..." />}
    {selected && error && <div className="mt-4"><AdminAlert><div className="flex justify-between gap-3"><span>{getApiErrorMessage(error, "Não foi possível carregar o histórico.")}</span><button className="underline" onClick={() => mutate()}>Tentar novamente</button></div></AdminAlert></div>}
    {selected && data && <div className="mt-6 space-y-3">{data.results.length === 0 ? <p className="text-sm text-slate-500">Nenhum evento registrado.</p> : data.results.map(event => <AdminPanel key={event.id} className="p-4"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-semibold">{event.tipo_evento.replaceAll("_", " ")}</h2><p className="text-sm text-slate-600">{labelStatus(event.situacao_anterior)} → {labelStatus(event.situacao_atual)}</p></div><div className="text-right text-xs text-slate-500"><div>{formatAdminDate(event.criado_em)}</div><div>{event.criado_por_nome || "Sistema"}</div></div></div>{event.justificativa && <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm"><strong>Justificativa:</strong> {event.justificativa}</p>}<details className="mt-3"><summary className="cursor-pointer text-sm font-medium">Metadados técnicos</summary><pre className="mt-2 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">{JSON.stringify(event.metadados, null, 2)}</pre></details></AdminPanel>)}</div>}
  </EdocsPage></RouteGuard>;
}
function labelStatus(value: string) { return value ? SITUACAO_LABELS[value as SituacaoPublicacao] ?? value : "Sem situação anterior"; }
