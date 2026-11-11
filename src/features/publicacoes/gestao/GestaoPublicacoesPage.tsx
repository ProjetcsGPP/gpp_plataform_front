"use client";

import { useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Calculator, Eye, FilePlus2, Plus, RotateCcw, Send, Trash2 } from "lucide-react";
import { AdminDataTable, type AdminTableColumn } from "@/components/admin/AdminDataTable";
import { AdminAlert, AdminPanel } from "@/components/admin/AdminPage";
import { AdminLoading } from "@/components/admin/AdminLoading";
import { RouteGuard } from "@/components/common/RouteGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EdocsFilters, EdocsModal, EdocsPage, EdocsSelectFilter, EdocsStatusBadge, EdocsTextFilter } from "@/features/publicacoes/edocs/EdocsUi";
import { usePermissions } from "@/hooks/usePermissions";
import { formatAdminDate } from "@/lib/adminResource";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { PERMISSIONS } from "@/lib/permissions";
import type { AdminTableDensity } from "@/types/admin";
import { addSecao, createPublicacao, getConflict, getPreviaPublicacao, getPublicacao, listPublicacoes, listVisoes, publicarPublicacao, recalcularPublicacao, reabrirPublicacao, removeSecao, revogarPublicacao, substituirPublicacao } from "./api";
import { publicacoesCacheKeys, revalidatePublicacoesCaches } from "./cache";
import { canUsePublicationAction, formatDecimal, formatNumber, SITUACAO_LABELS } from "./format";
import type { Publicacao, SecaoPublicacao, SituacaoPublicacao } from "./model";

const STATUS = Object.keys(SITUACAO_LABELS) as SituacaoPublicacao[];

export function GestaoPublicacoesPage() {
  const { can } = usePermissions();
  const { mutate: mutateCache } = useSWRConfig();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [status, setStatus] = useState("");
  const [ordering, setOrdering] = useState("-ano_referencia");
  const [density, setDensity] = useState<AdminTableDensity>("compact");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "error" | "success"; message: string } | null>(null);
  const key = publicacoesCacheKeys.list([page, pageSize, search, year, month, status, ordering]);
  const { data, error, isLoading, isValidating, mutate } = useSWR(key, () => listPublicacoes({
    page, page_size: pageSize, search: search.trim() || undefined,
    ano_referencia: year ? Number(year) : undefined,
    mes_referencia: month ? Number(month) : undefined,
    situacao: (status || undefined) as SituacaoPublicacao | undefined,
    ordering,
  }), { keepPreviousData: true, revalidateOnFocus: false });

  const columns: AdminTableColumn<Publicacao, string>[] = [
    { key: "titulo", label: "Publicação", render: row => <div><strong>{row.titulo}</strong><span className="block text-xs text-slate-500">Versão {row.versao}</span></div> },
    { key: "competencia", label: "Competência", render: row => row.competencia },
    { key: "situacao", label: "Situação", render: row => <EdocsStatusBadge positive={row.situacao === "PUBLICADA"} negative={row.situacao === "REVOGADA" || row.situacao === "CANCELADA"}>{SITUACAO_LABELS[row.situacao]}</EdocsStatusBadge> },
    { key: "publicada_em", label: "Publicada em", render: row => row.publicada_em ? formatAdminDate(row.publicada_em) : "—" },
    { key: "responsavel", label: "Responsável", render: row => row.publicada_por_nome || "—" },
    { key: "acoes", label: "Ações", className: "text-right", headerClassName: "text-right", render: row => <Button size="sm" variant="outline" onClick={() => setSelectedId(row.id)}><Eye /> Abrir</Button> },
  ];

  return <RouteGuard permission={PERMISSIONS.PUBLICACAO_VIEW} loadingFallback={<AdminLoading label="Verificando acesso à gestão editorial..." />}>
    <EdocsPage title="Gestão de publicações" description="Prepare, confira e publique versões mensais a partir dos snapshots oficiais congelados pelo backend." actions={can(PERMISSIONS.PUBLICACAO_ADD) ? <Button onClick={() => setCreating(true)}><FilePlus2 /> Nova publicação</Button> : undefined}>
      {feedback && <div className="mb-4"><AdminAlert variant={feedback.kind} onClose={() => setFeedback(null)}>{feedback.message}</AdminAlert></div>}
      <EdocsFilters>
        <EdocsTextFilter label="Pesquisar" value={search} placeholder="Título ou hash" onChange={value => { setSearch(value); setPage(1); }} />
        <label className="text-xs font-medium text-slate-600">Ano<Input className="mt-1 w-28 bg-white" type="number" min={2024} value={year} onChange={event => { setYear(event.target.value); setPage(1); }} /></label>
        <EdocsSelectFilter label="Mês" value={month} onChange={value => { setMonth(value); setPage(1); }}><option value="">Todos</option>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{String(index + 1).padStart(2, "0")}</option>)}</EdocsSelectFilter>
        <EdocsSelectFilter label="Situação" value={status} onChange={value => { setStatus(value); setPage(1); }}><option value="">Todas</option>{STATUS.map(value => <option key={value} value={value}>{SITUACAO_LABELS[value]}</option>)}</EdocsSelectFilter>
        <EdocsSelectFilter label="Ordenar" value={ordering} onChange={value => setOrdering(value)}><option value="-ano_referencia">Competência mais recente</option><option value="ano_referencia">Competência mais antiga</option><option value="-publicada_em">Publicação mais recente</option><option value="situacao">Situação</option></EdocsSelectFilter>
      </EdocsFilters>
      <AdminDataTable rows={data?.results ?? []} columns={columns} getRowKey={row => row.id} sorting={[]} onSort={() => undefined} page={page} pageSize={pageSize} pageSizeOptions={[10, 20, 50]} totalCount={data?.count ?? 0} hasPreviousPage={Boolean(data?.previous)} hasNextPage={Boolean(data?.next)} onPageChange={setPage} onPageSizeChange={value => { setPageSize(value); setPage(1); }} density={density} onDensityChange={setDensity} onResetView={() => { setDensity("compact"); setOrdering("-ano_referencia"); }} isLoading={isLoading} isRefreshing={isValidating && Boolean(data)} errorMessage={error ? getApiErrorMessage(error, "Não foi possível carregar as publicações.") : null} onRetry={() => mutate()} emptyMessage="Nenhuma publicação encontrada." />
    </EdocsPage>
    {creating && <CreateDialog onClose={() => setCreating(false)} onCreated={async created => { setCreating(false); setSelectedId(created.id); await revalidatePublicacoesCaches(mutateCache); setFeedback({ kind: "success", message: "Rascunho criado." }); }} />}
    {selectedId && <PublicationDialog id={selectedId} onClose={() => setSelectedId(null)} onNewId={setSelectedId} onFeedback={setFeedback} />}
  </RouteGuard>;
}

function CreateDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (value: Publicacao) => Promise<void> }) {
  const [title, setTitle] = useState(""); const [year, setYear] = useState(new Date().getFullYear()); const [month, setMonth] = useState(new Date().getMonth() + 1); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  return <EdocsModal title="Nova publicação" onClose={onClose}><div className="mt-4 space-y-4"><label className="block text-sm font-medium">Título<Input className="mt-1" value={title} onChange={event => setTitle(event.target.value)} /></label><div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium">Ano<Input className="mt-1" type="number" min={2024} value={year} onChange={event => setYear(Number(event.target.value))} /></label><label className="text-sm font-medium">Mês<select className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2" value={month} onChange={event => setMonth(Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{String(index + 1).padStart(2, "0")}</option>)}</select></label></div>{year < 2024 && <p className="text-sm text-red-700">O ano mínimo é 2024.</p>}{error && <AdminAlert>{error}</AdminAlert>}<div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button disabled={!title.trim() || year < 2024 || saving} onClick={async () => { setSaving(true); setError(""); try { await onCreated(await createPublicacao({ titulo: title.trim(), ano_referencia: year, mes_referencia: month })); } catch (caught) { setError(getApiErrorMessage(caught, "Não foi possível criar o rascunho.")); } finally { setSaving(false); } }}>{saving ? "Criando..." : "Criar rascunho"}</Button></div></div></EdocsModal>;
}

function PublicationDialog({ id, onClose, onNewId, onFeedback }: { id: string; onClose: () => void; onNewId: (id: string) => void; onFeedback: (value: { kind: "error" | "success"; message: string }) => void }) {
  const { can } = usePermissions(); const { mutate: mutateCache } = useSWRConfig();
  const { data, error, isLoading, mutate } = useSWR(publicacoesCacheKeys.detail(id), () => getPublicacao(id), { revalidateOnFocus: false });
  const [preview, setPreview] = useState<Publicacao | null>(null); const [adding, setAdding] = useState(false); const [transition, setTransition] = useState<"publicar" | "revogar" | null>(null); const [busy, setBusy] = useState(""); const [localError, setLocalError] = useState("");
  const allowed = (action: string, permission: Parameters<typeof can>[0]) => Boolean(data && canUsePublicationAction(can(permission), data.acoes_disponiveis, action));

  async function run(action: string, operation: () => Promise<Publicacao>, success: string) {
    setBusy(action); setLocalError("");
    try { const updated = await operation(); await mutate(updated, { revalidate: false }); await revalidatePublicacoesCaches(mutateCache); onFeedback({ kind: "success", message: success }); }
    catch (caught) { const conflict = getConflict(caught); setLocalError(conflict?.detalhe ?? getApiErrorMessage(caught)); if (conflict?.codigo === "CONCORRENCIA_PUBLICACAO") { await mutate(); setLocalError(`${conflict.detalhe} O registro foi recarregado; revise-o antes de tentar novamente.`); } }
    finally { setBusy(""); }
  }

  return <EdocsModal title="Detalhes da publicação" onClose={onClose} extraWide>
    {isLoading && <AdminLoading label="Carregando publicação..." />}{error && <AdminAlert>{getApiErrorMessage(error, "Não foi possível carregar a publicação.")}</AdminAlert>}
    {data && <div className="mt-4 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-xl font-bold">{data.titulo}</h3><p className="text-sm text-slate-600">Competência {data.competencia} · versão {data.versao} · registro {data.versao_registro}</p></div><EdocsStatusBadge positive={data.situacao === "PUBLICADA"} negative={data.situacao === "REVOGADA"}>{SITUACAO_LABELS[data.situacao]}</EdocsStatusBadge></div>
      {localError && <AdminAlert onClose={() => setLocalError("")}>{localError}</AdminAlert>}
      <section><div className="mb-3 flex items-center justify-between"><div><h4 className="font-semibold">Seções</h4><p className="text-xs text-slate-500">As fontes canônicas são escolhidas e congeladas pelo backend.</p></div>{allowed("adicionar_secao", PERMISSIONS.PUBLICACAO_CHANGE) && <Button size="sm" onClick={() => setAdding(true)}><Plus /> Incluir seção</Button>}</div>
        <div className="space-y-2">{data.secoes.length === 0 ? <p className="rounded-lg border border-dashed p-5 text-center text-sm text-slate-500">Nenhuma seção incluída.</p> : data.secoes.map(section => <div key={section.id} className="flex items-center justify-between rounded-lg border p-3"><div><strong>{section.ordem}. {section.titulo}</strong><span className="ml-2 text-xs text-slate-500">{section.fonte} · {section.perfil_calculo}</span></div>{allowed("remover_secao", PERMISSIONS.PUBLICACAO_CHANGE) && <Button size="sm" variant="destructive" disabled={busy === `remove-${section.id}`} onClick={() => run(`remove-${section.id}`, () => removeSecao(id, section.id), "Seção removida.")}><Trash2 /> Remover</Button>}</div>)}</div>
      </section>
      <div className="flex flex-wrap gap-2 border-t pt-4">
        {allowed("recalcular", PERMISSIONS.PUBLICACAO_CALCULAR) && <Button disabled={Boolean(busy)} onClick={() => run("recalcular", () => recalcularPublicacao(id), "Publicação calculada e validada.")}><Calculator /> {busy === "recalcular" ? "Calculando..." : "Calcular"}</Button>}
        {allowed("visualizar_previa", PERMISSIONS.PUBLICACAO_PREVIA_VIEW) && <Button variant="outline" disabled={busy === "preview"} onClick={async () => { setBusy("preview"); setLocalError(""); try { setPreview(await getPreviaPublicacao(id)); } catch (caught) { setLocalError(getApiErrorMessage(caught, "Não foi possível carregar a prévia.")); } finally { setBusy(""); } }}><Eye /> Visualizar prévia</Button>}
        {allowed("reabrir", PERMISSIONS.PUBLICACAO_CHANGE) && <Button variant="outline" disabled={Boolean(busy)} onClick={() => run("reabrir", () => reabrirPublicacao(id), "Publicação reaberta para ajustes.")}><RotateCcw /> Reabrir</Button>}
        {allowed("publicar", PERMISSIONS.PUBLICACAO_PUBLICAR) && <Button disabled={Boolean(busy)} onClick={() => setTransition("publicar")}><Send /> Publicar</Button>}
        {allowed("substituir", PERMISSIONS.PUBLICACAO_SUBSTITUIR) && <Button variant="outline" disabled={Boolean(busy)} onClick={async () => { setBusy("substituir"); try { const created = await substituirPublicacao(id); await revalidatePublicacoesCaches(mutateCache); onNewId(created.id); onFeedback({ kind: "success", message: "Nova versão criada em rascunho." }); } catch (caught) { setLocalError(getApiErrorMessage(caught)); } finally { setBusy(""); } }}><FilePlus2 /> Criar substituta</Button>}
        {allowed("revogar", PERMISSIONS.PUBLICACAO_REVOGAR) && <Button variant="destructive" disabled={Boolean(busy)} onClick={() => setTransition("revogar")}><Trash2 /> Revogar</Button>}
      </div>
    </div>}
    {data && adding && <AddSectionDialog publicacao={data} onClose={() => setAdding(false)} onSaved={async updated => { setAdding(false); await mutate(updated, { revalidate: false }); await revalidatePublicacoesCaches(mutateCache); }} />}
    {data && transition && <JustificationDialog action={transition} onClose={() => setTransition(null)} onConfirm={async justification => { setTransition(null); await run(transition, () => transition === "publicar" ? publicarPublicacao(id, justification, data.versao_registro) : revogarPublicacao(id, justification), transition === "publicar" ? "Publicação publicada." : "Publicação revogada."); }} />}
    {preview && <PreviewDialog publicacao={preview} onClose={() => setPreview(null)} />}
  </EdocsModal>;
}

function AddSectionDialog({ publicacao, onClose, onSaved }: { publicacao: Publicacao; onClose: () => void; onSaved: (value: Publicacao) => Promise<void> }) {
  const { data } = useSWR(publicacoesCacheKeys.views(["active"]), () => listVisoes({ ativa: true, page_size: 100 }), { revalidateOnFocus: false });
  const [viewId, setViewId] = useState(""); const [title, setTitle] = useState(""); const [order, setOrder] = useState(publicacao.secoes.length + 1); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  return <EdocsModal title="Incluir seção" onClose={onClose}><div className="mt-4 space-y-3"><label className="block text-sm font-medium">Visão<select className="mt-1 block w-full rounded-md border p-2" value={viewId} onChange={event => { const id = event.target.value; setViewId(id); const view = data?.results.find(item => item.id === id); if (view && !title) setTitle(view.nome); }}><option value="">Selecione</option>{data?.results.filter(view => view.ativa).map(view => <option key={view.id} value={view.id}>{view.nome} ({view.fonte})</option>)}</select></label><label className="block text-sm font-medium">Título<Input className="mt-1" value={title} onChange={event => setTitle(event.target.value)} /></label><label className="block text-sm font-medium">Ordem<Input className="mt-1" type="number" min={1} max={999} value={order} onChange={event => setOrder(Number(event.target.value))} /></label><p className="text-xs text-slate-500">A coleta não é enviada: o backend selecionará a fonte canônica vigente.</p>{error && <AdminAlert>{error}</AdminAlert>}<div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button disabled={!viewId || !title.trim() || order < 1 || saving} onClick={async () => { setSaving(true); try { await onSaved(await addSecao(publicacao.id, { configuracao_visao_id: viewId, titulo: title.trim(), ordem: order })); } catch (caught) { setError(getApiErrorMessage(caught, "Não foi possível incluir a seção.")); } finally { setSaving(false); } }}>{saving ? "Incluindo..." : "Incluir"}</Button></div></div></EdocsModal>;
}

function JustificationDialog({ action, onClose, onConfirm }: { action: "publicar" | "revogar"; onClose: () => void; onConfirm: (value: string) => Promise<void> }) {
  const [value, setValue] = useState(""); const [confirmed, setConfirmed] = useState(false); const [saving, setSaving] = useState(false); const title = action === "publicar" ? "Confirmar publicação" : "Confirmar revogação";
  return <EdocsModal title={title} onClose={onClose}><div className="mt-4 space-y-4"><p className="text-sm text-slate-600">Esta transição será registrada na auditoria e exige justificativa.</p><label className="block text-sm font-medium">Justificativa<textarea className="mt-1 block w-full rounded-md border p-3" rows={4} value={value} onChange={event => setValue(event.target.value)} /></label><label className="flex gap-2 rounded-lg border p-3 text-sm"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />Revisei a prévia e confirmo esta ação.</label><div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Voltar</Button><Button variant={action === "revogar" ? "destructive" : "default"} disabled={!value.trim() || !confirmed || saving} onClick={async () => { setSaving(true); await onConfirm(value.trim()); setSaving(false); }}>{saving ? "Confirmando..." : title}</Button></div></div></EdocsModal>;
}

function PreviewDialog({ publicacao, onClose }: { publicacao: Publicacao; onClose: () => void }) {
  const sections = useMemo(() => [...publicacao.secoes].sort((a, b) => a.ordem - b.ordem), [publicacao.secoes]);
  return <EdocsModal title={`Prévia — ${publicacao.titulo}`} onClose={onClose} extraWide><div className="mt-4 space-y-5"><p className="text-sm text-slate-600">Conteúdo congelado pelo backend para {publicacao.competencia}. Esta visualização não recalcula indicadores.</p>{sections.map(section => <PreviewSection key={section.id} section={section} />)}</div></EdocsModal>;
}

function PreviewSection({ section }: { section: SecaoPublicacao }) {
  const result = section.resultado; const totals = (result.totais ?? {}) as Record<string, unknown>;
  const patriarchs = Array.isArray(result.patriarcas) ? result.patriarcas as Record<string, unknown>[] : [];
  const top = Array.isArray(result.orgaos_maior_quantidade_fluxos) ? result.orgaos_maior_quantidade_fluxos as Record<string, unknown>[] : [];
  const audience = Array.isArray(result.distribuicao_publico_alvo) ? result.distribuicao_publico_alvo as Record<string, unknown>[] : [];
  return <AdminPanel className="p-5"><div className="flex justify-between gap-3"><div><h3 className="text-lg font-semibold">{section.ordem}. {section.titulo}</h3><p className="text-xs text-slate-500">{section.fonte} · {section.perfil_calculo} · coleta {section.coleta_edocs_id ?? section.coleta_eflow_id ?? "—"}</p></div></div>
    {section.fonte === "EDOCS" ? <><div className="mt-4 grid gap-3 sm:grid-cols-4"><Metric label="Patriarcas" value={formatNumber(result.quantidade_patriarcas)} /><Metric label="Processos" value={formatNumber(totals.total_processos)} /><Metric label="Documentos" value={formatNumber(totals.total_documentos)} /><Metric label="Páginas" value={formatNumber(totals.total_paginas)} /><Metric label="Economia total" value={`R$ ${formatDecimal(totals.economia_total_reais)}`} /><Metric label="Papel economizado" value={`${formatDecimal(totals.economia_papel_kg)} kg`} /><Metric label="Água economizada" value={`${formatDecimal(totals.economia_agua_m3)} m³`} /><Metric label="Árvores salvas" value={formatDecimal(totals.arvores_salvas)} /></div><details className="mt-4"><summary className="cursor-pointer font-medium">Resultados por patriarca ({patriarchs.length})</summary><div className="mt-2 overflow-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-2">Patriarca</th><th>Processos</th><th>Documentos</th><th>Páginas</th></tr></thead><tbody>{patriarchs.map((item, index) => <tr key={String(item.patriarca_id ?? index)} className="border-b"><td className="p-2">{String(item.sigla_patriarca ?? "")} — {String(item.nome_patriarca ?? "")}</td><td>{formatNumber(item.total_processos)}</td><td>{formatNumber(item.total_documentos)}</td><td>{formatNumber(item.total_paginas)}</td></tr>)}</tbody></table></div></details></> : <><div className="mt-4 grid gap-3 sm:grid-cols-3"><Metric label="Fluxos" value={formatNumber(result.quantidade_fluxos)} /><Metric label="Órgãos participantes" value={formatNumber(result.quantidade_orgaos_participantes)} /><Metric label="Setores ativos" value={formatNumber(result.quantidade_setores_ativos)} /></div><div className="mt-4 grid gap-4 lg:grid-cols-2"><IndicatorList title="Órgãos com mais fluxos" values={top} nameKey="orgao" /><IndicatorList title="Distribuição por público-alvo" values={audience} nameKey="publico_alvo" /></div><details className="mt-4"><summary className="cursor-pointer font-medium">Proveniência e vigência</summary><pre className="mt-2 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">{JSON.stringify(section.configuracao_congelada, null, 2)}</pre></details></>}
  </AdminPanel>;
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border bg-slate-50 p-3"><span className="block text-xs text-slate-500">{label}</span><strong className="text-lg">{value}</strong></div>; }
function IndicatorList({ title, values, nameKey }: { title: string; values: Record<string, unknown>[]; nameKey: string }) { return <div><h4 className="font-medium">{title}</h4><ul className="mt-2 space-y-1 text-sm">{values.map((item, index) => <li key={`${String(item[nameKey])}-${index}`} className="flex justify-between rounded bg-slate-50 px-3 py-2"><span>{String(item[nameKey] ?? "—")}</span><span>{formatNumber(item.quantidade_fluxos)} · {formatDecimal(item.percentual)}%</span></li>)}</ul></div>; }
