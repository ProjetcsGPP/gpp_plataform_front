"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Pencil, Plus } from "lucide-react";
import { AdminDataTable, type AdminTableColumn } from "@/components/admin/AdminDataTable";
import { AdminAlert } from "@/components/admin/AdminPage";
import { AdminLoading } from "@/components/admin/AdminLoading";
import { RouteGuard } from "@/components/common/RouteGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EdocsModal, EdocsPage, EdocsStatusBadge } from "@/features/publicacoes/edocs/EdocsUi";
import { listPatriarcasEdocs } from "@/features/publicacoes/edocs/api";
import { usePermissions } from "@/hooks/usePermissions";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { PERMISSIONS } from "@/lib/permissions";
import type { AdminTableDensity } from "@/types/admin";
import { createVisao, listVisoes, updateVisao } from "./api";
import { publicacoesCacheKeys, revalidatePublicacoesCaches } from "./cache";
import { personalizedScopeIsValid } from "./format";
import type { EscopoVisao, FonteVisao, PerfilEflow, VisaoPayload, VisaoPublicacao } from "./model";

export function VisoesPublicacaoPage() {
  const { can } = usePermissions(); const { mutate: mutateCache } = useSWRConfig();
  const { data, error, isLoading, isValidating, mutate } = useSWR(publicacoesCacheKeys.views(), () => listVisoes({ page_size: 100 }), { revalidateOnFocus: false });
  const [editing, setEditing] = useState<VisaoPublicacao | null | "new">(null);
  const [feedback, setFeedback] = useState<{ kind: "error" | "success"; message: string } | null>(null);
  const [density, setDensity] = useState<AdminTableDensity>("compact");
  const columns: AdminTableColumn<VisaoPublicacao, string>[] = [
    { key: "nome", label: "Visão", render: row => <div><strong>{row.nome}</strong><span className="block text-xs text-slate-500">{row.codigo}</span></div> },
    { key: "fonte", label: "Fonte", render: row => row.fonte === "EDOCS" ? "E-Docs" : "E-Flow" },
    { key: "escopo", label: "Escopo", render: row => ({ TODOS: "Todos", MUNICIPIOS: "Municípios", PERSONALIZADO: "Personalizado" })[row.escopo] },
    { key: "perfil", label: "Perfil E-Flow", render: row => row.perfil_calculo_eflow || "Não se aplica" },
    { key: "versao", label: "Versão", render: row => row.versao },
    { key: "ativa", label: "Situação", render: row => <EdocsStatusBadge positive={row.ativa} negative={!row.ativa}>{row.ativa ? "Ativa" : "Inativa"}</EdocsStatusBadge> },
    { key: "acoes", label: "Ações", className: "text-right", headerClassName: "text-right", render: row => can(PERMISSIONS.PUBLICACAO_VISAO_CONFIGURAR) && row.ativa ? <Button size="sm" variant="outline" onClick={() => setEditing(row)}><Pencil /> Editar</Button> : <span className="text-xs text-slate-400">Somente leitura</span> },
  ];
  return <RouteGuard permission={PERMISSIONS.PUBLICACAO_VISAO_VIEW} loadingFallback={<AdminLoading label="Verificando acesso às visões..." />}><EdocsPage title="Visões de publicação" description="Configure filtros editoriais reutilizáveis. Publicações calculadas mantêm a fotografia imutável da versão utilizada." actions={can(PERMISSIONS.PUBLICACAO_VISAO_CONFIGURAR) ? <Button onClick={() => setEditing("new")}><Plus /> Nova visão</Button> : undefined}>
    {feedback && <div className="mb-4"><AdminAlert variant={feedback.kind} onClose={() => setFeedback(null)}>{feedback.message}</AdminAlert></div>}
    <AdminDataTable rows={data?.results ?? []} columns={columns} getRowKey={row => row.id} sorting={[]} onSort={() => undefined} page={1} pageSize={100} pageSizeOptions={[100]} totalCount={data?.count ?? 0} hasPreviousPage={false} hasNextPage={false} onPageChange={() => undefined} onPageSizeChange={() => undefined} density={density} onDensityChange={setDensity} onResetView={() => setDensity("compact")} isLoading={isLoading} isRefreshing={isValidating && Boolean(data)} errorMessage={error ? getApiErrorMessage(error, "Não foi possível carregar as visões.") : null} onRetry={() => mutate()} emptyMessage="Nenhuma visão configurada." />
  </EdocsPage>{editing && <ViewDialog initial={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await revalidatePublicacoesCaches(mutateCache); setFeedback({ kind: "success", message: "Visão salva. Publicações anteriores permanecem inalteradas." }); }} />}</RouteGuard>;
}

function ViewDialog({ initial, onClose, onSaved }: { initial: VisaoPublicacao | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const [code, setCode] = useState(initial?.codigo ?? ""); const [name, setName] = useState(initial?.nome ?? ""); const [description, setDescription] = useState(initial?.descricao ?? "");
  const [source, setSource] = useState<FonteVisao>(initial?.fonte ?? "EDOCS"); const [scope, setScope] = useState<EscopoVisao>(initial?.escopo ?? "MUNICIPIOS"); const [profile, setProfile] = useState<PerfilEflow>(initial?.perfil_calculo_eflow || "CONSOLIDADO_PUBLICACAO"); const [active, setActive] = useState(initial?.ativa ?? true); const [selected, setSelected] = useState<number[]>(initial?.patriarcas_ids ?? []); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  const { data: patriarchs, error: patriarchError } = useSWR(scope === "PERSONALIZADO" ? ["publicacao-view-patriarchs"] : null, () => listPatriarcasEdocs({ page: 1, page_size: 200, ordering: "nome", ativo: true }), { revalidateOnFocus: false });
  const invalidCustom = !personalizedScopeIsValid(scope, selected);
  async function save() { setSaving(true); setError(""); const payload: VisaoPayload = { codigo: code.trim().toUpperCase(), nome: name.trim(), descricao: description.trim(), fonte: source, escopo: scope, ativa: active, patriarcas_ids: scope === "PERSONALIZADO" ? selected : [], ...(source === "EFLOW" ? { perfil_calculo_eflow: profile } : {}) }; try { if (initial) await updateVisao(initial.id, payload); else await createVisao(payload); await onSaved(); } catch (caught) { setError(getApiErrorMessage(caught, "Não foi possível salvar a visão.")); } finally { setSaving(false); } }
  return <EdocsModal title={initial ? "Editar visão" : "Nova visão"} onClose={onClose} wide><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Código<Input className="mt-1" value={code} disabled={Boolean(initial)} onChange={event => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))} /></label><label className="text-sm font-medium">Nome<Input className="mt-1" value={name} onChange={event => setName(event.target.value)} /></label><label className="sm:col-span-2 text-sm font-medium">Descrição<textarea className="mt-1 block w-full rounded-md border p-3" rows={3} value={description} onChange={event => setDescription(event.target.value)} /></label><label className="text-sm font-medium">Fonte<select className="mt-1 block w-full rounded-md border p-2" value={source} onChange={event => setSource(event.target.value as FonteVisao)}><option value="EDOCS">E-Docs</option><option value="EFLOW">E-Flow</option></select></label><label className="text-sm font-medium">Escopo<select className="mt-1 block w-full rounded-md border p-2" value={scope} onChange={event => setScope(event.target.value as EscopoVisao)}><option value="TODOS">Todos</option><option value="MUNICIPIOS">Municípios</option><option value="PERSONALIZADO">Personalizado</option></select></label>{source === "EFLOW" && <label className="text-sm font-medium">Perfil de cálculo<select className="mt-1 block w-full rounded-md border p-2" value={profile} onChange={event => setProfile(event.target.value as PerfilEflow)}><option value="COMPLETO_TECNICO">Completo técnico</option><option value="CONSOLIDADO_PUBLICACAO">Consolidado para publicação</option></select></label>}<label className="flex items-center gap-2 self-end rounded-md border p-2 text-sm"><input type="checkbox" checked={active} onChange={event => setActive(event.target.checked)} />Visão ativa</label>
    {scope === "PERSONALIZADO" && <fieldset className="sm:col-span-2"><legend className="text-sm font-medium">Patriarcas</legend>{patriarchError ? <AdminAlert>Não foi possível carregar os patriarcas.</AdminAlert> : <div className="mt-2 max-h-56 overflow-auto rounded-md border p-3">{patriarchs?.results.map(item => <label key={item.id} className="flex gap-2 border-b py-2 text-sm"><input type="checkbox" checked={selected.includes(item.id)} onChange={event => setSelected(current => event.target.checked ? [...current, item.id] : current.filter(id => id !== item.id))} /><span><strong>{item.sigla}</strong> — {item.nome}</span></label>)}</div>}{invalidCustom && <p className="mt-1 text-sm text-red-700">Selecione ao menos um patriarca.</p>}</fieldset>}
  </div>{error && <div className="mt-4"><AdminAlert>{error}</AdminAlert></div>}<div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button disabled={!code.trim() || !name.trim() || invalidCustom || saving} onClick={() => void save()}>{saving ? "Salvando..." : "Salvar visão"}</Button></div></EdocsModal>;
}
