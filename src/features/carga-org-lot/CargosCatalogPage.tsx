"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { ArrowLeft, CheckCircle2, Eye, Link2, Plus, Search, ShieldCheck, X } from "lucide-react";

import { AdminAlert, AdminPage } from "@/components/admin/AdminPage";
import { RouteGuard } from "@/components/common/RouteGuard";
import { Button } from "@/components/ui/button";
import {
  createCargoReferencia,
  listCargosReferencia,
  listMapeamentosCargo,
  listOcorrenciasCargo,
  listVariacoesCargo,
  saveMapeamentoCargo,
  updateCargoReferencia,
  updateVariacaoCargo,
} from "@/features/carga-org-lot/api";
import type { CargoReferencia, VariacaoCargo } from "@/features/carga-org-lot/model";
import { usePatriarcaSelection } from "@/features/carga-org-lot/usePatriarcaSelection";
import { LotacoesSectionNav } from "@/features/carga-org-lot/LotacoesSectionNav";
import { usePermissions } from "@/hooks/usePermissions";
import { formatAdminDate } from "@/lib/adminResource";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { PERMISSIONS } from "@/lib/permissions";

export function CargosCatalogPage() {
  const { can } = usePermissions();
  const { selected } = usePatriarcaSelection();
  const canAdd = can(PERMISSIONS.IMPORTACAOPLANILHA_ADD);
  const canChange = can(PERMISSIONS.IMPORTACAOPLANILHA_CHANGE);
  const [tab, setTab] = useState<"CARGOS" | "VARIACOES" | "MAPEAMENTOS">("VARIACOES");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [linking, setLinking] = useState<VariacaoCargo | null>(null);
  const [occurrenceVariation, setOccurrenceVariation] = useState<VariacaoCargo | null>(null);
  const [confirmation, setConfirmation] = useState<{
    title: string;
    description: string;
    action: () => Promise<unknown>;
  } | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "error" | "success"; message: string } | null>(null);

  const commonParams = { page, page_size: 20, ...(query.trim() ? { q: query.trim() } : {}), ...(status ? { status } : {}) };
  const cargos = useSWR(
    ["carga-org-lot:cargos-referencia", tab, query, status, page],
    () => listCargosReferencia(tab === "CARGOS" ? commonParams : { ativo: true, page_size: 200, ordering: "strnome" }),
    { revalidateOnFocus: false },
  );
  const variacoes = useSWR(
    tab === "VARIACOES" ? ["carga-org-lot:variacoes-cargo", query, status, page] : null,
    () => listVariacoesCargo(commonParams),
    { revalidateOnFocus: false },
  );
  const mappings = useSWR(
    tab === "MAPEAMENTOS" && selected
      ? ["carga-org-lot:mapeamentos-cargo", selected.idpatriarca, page]
      : null,
    () => listMapeamentosCargo({ patriarca: selected!.idpatriarca, page, page_size: 20 }),
    { revalidateOnFocus: false },
  );

  async function refresh() {
    await Promise.all([cargos.mutate(), variacoes.mutate(), mappings.mutate()]);
  }

  function switchTab(value: typeof tab) {
    setTab(value);
    setQuery("");
    setStatus("");
    setPage(1);
  }

  const current = tab === "CARGOS" ? cargos.data : tab === "VARIACOES" ? variacoes.data : mappings.data;
  const loading = tab === "CARGOS" ? cargos.isLoading : tab === "VARIACOES" ? variacoes.isLoading : mappings.isLoading;
  const error = tab === "CARGOS" ? cargos.error : tab === "VARIACOES" ? variacoes.error : mappings.error;

  return <RouteGuard permission={PERMISSIONS.IMPORTACAOPLANILHA_VIEW}><AdminPage title="Catálogo de cargos" description="Revise cargos canônicos, variações encontradas nas planilhas e regras específicas do patriarca." actions={<Button variant="outline" asChild><Link href="/carga-org-lot/lotacoes"><ArrowLeft /> Voltar às lotações</Link></Button>}>
    <div className="space-y-4">
      <LotacoesSectionNav />
      {feedback && <AdminAlert variant={feedback.kind} onClose={() => setFeedback(null)}>{feedback.message}</AdminAlert>}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap gap-2">{([ ["VARIACOES", "Variações encontradas"], ["CARGOS", "Cargos canônicos"], ["MAPEAMENTOS", "Regras deste patriarca"] ] as const).map(([value, label]) => <Button key={value} size="sm" variant={tab === value ? "default" : "outline"} onClick={() => switchTab(value)}>{label}</Button>)}</div>
        {tab === "CARGOS" && canAdd && <Button size="sm" onClick={() => setCreating(true)}><Plus /> Novo cargo canônico</Button>}
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        {tab !== "MAPEAMENTOS" && <label className="min-w-64 flex-1 text-xs font-medium text-slate-600">Pesquisar<div className="relative mt-1"><Search className="absolute left-3 top-2.5 size-4 text-slate-400" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={tab === "CARGOS" ? "Nome do cargo" : "Descrição encontrada"} className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm" /></div></label>}
        {tab === "CARGOS" && <Select label="Situação" value={status} onChange={(value) => { setStatus(value); setPage(1); }}><option value="">Todas</option><option value="NOVO">Novos</option><option value="CONFIRMADO">Confirmados</option><option value="INATIVO">Inativos</option></Select>}
        {tab === "VARIACOES" && <Select label="Situação" value={status} onChange={(value) => { setStatus(value); setPage(1); }}><option value="">Todas</option><option value="NOVA">Novas</option><option value="EM_ANALISE">Em análise</option><option value="CONFIRMADA">Confirmadas</option><option value="AMBIGUA">Ambíguas</option><option value="IGNORADA">Ignoradas</option></Select>}
        {tab === "MAPEAMENTOS" && <p className="text-sm text-slate-600">Exceções locais de <strong>{selected?.strsiglapatriarca} — {selected?.strnome}</strong>. Elas têm precedência sobre o catálogo global.</p>}
      </div>

      <div className="overflow-auto rounded-xl border border-slate-200 bg-white">
        {loading ? <p className="p-12 text-center text-sm text-slate-500">Carregando catálogo...</p> : error ? <AdminAlert variant="error">{getApiErrorMessage(error, "Não foi possível carregar o catálogo de cargos.")}</AdminAlert> : tab === "CARGOS" ? <table className="w-full min-w-[58rem] text-left text-sm"><thead className="bg-slate-100 text-xs uppercase text-slate-600"><tr><th className="px-4 py-3">Cargo canônico</th><th className="px-4 py-3">Situação</th><th className="px-4 py-3">Origem</th><th className="px-4 py-3">Atualização</th><th className="px-4 py-3 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-100">{cargos.data?.results.map((cargo) => <tr key={cargo.idcargoreferencia}><td className="px-4 py-3"><strong>{cargo.strnome}</strong><span className="block max-w-xl text-xs text-slate-500">{cargo.strdescricao || "Sem descrição"}</span></td><td className="px-4 py-3"><StatusBadge label={cargo.status_nome} active={cargo.strstatus === "CONFIRMADO" && cargo.flgativo} /></td><td className="px-4 py-3">{cargo.strorigem}</td><td className="px-4 py-3">{formatAdminDate(cargo.updated_at)}</td><td className="px-4 py-3"><div className="flex justify-end gap-1">{canChange && cargo.strstatus === "NOVO" && <Button size="sm" variant="outline" onClick={() => setConfirmation({ title: "Confirmar cargo canônico", description: `“${cargo.strnome}” ficará disponível para correspondências globais e locais.`, action: () => updateCargoReferencia(cargo.idcargoreferencia, { strstatus: "CONFIRMADO", flgativo: true }) })}><CheckCircle2 /> Confirmar</Button>}{canChange && cargo.strstatus !== "INATIVO" && <Button size="sm" variant="ghost" onClick={() => setConfirmation({ title: "Inativar cargo canônico", description: `“${cargo.strnome}” deixará de estar disponível para novas correspondências. O histórico será preservado.`, action: () => updateCargoReferencia(cargo.idcargoreferencia, { strstatus: "INATIVO", flgativo: false }) })}>Inativar</Button>}</div></td></tr>)}</tbody></table> : tab === "VARIACOES" ? <table className="w-full min-w-[68rem] text-left text-sm"><thead className="bg-slate-100 text-xs uppercase text-slate-600"><tr><th className="px-4 py-3">Descrição encontrada</th><th className="px-4 py-3">Cargo canônico</th><th className="px-4 py-3">Situação</th><th className="px-4 py-3">Ocorrências</th><th className="px-4 py-3">Abrangência</th><th className="px-4 py-3 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-100">{variacoes.data?.results.map((variation) => <tr key={variation.idvariacaocargo}><td className="px-4 py-3 font-medium">{variation.strdescricao}</td><td className="px-4 py-3">{variation.cargo_referencia_nome || <span className="text-amber-700">Aguardando decisão</span>}</td><td className="px-4 py-3"><StatusBadge label={variation.status_nome} active={variation.strstatus === "CONFIRMADA"} /></td><td className="px-4 py-3"><strong>{variation.inttotalocorrencias}</strong><span className="block text-xs text-slate-500">última em {formatAdminDate(variation.datultimaocorrencia)}</span></td><td className="px-4 py-3">{variation.inttotalimportacoes} importações<span className="block text-xs text-slate-500">{variation.inttotalpatriarcas} patriarcas</span></td><td className="px-4 py-3"><div className="flex justify-end gap-1"><Button variant="ghost" size="sm" onClick={() => setOccurrenceVariation(variation)}><Eye /> Ocorrências</Button>{canChange && <Button variant="outline" size="sm" onClick={() => setLinking(variation)}><Link2 /> {variation.idcargoreferencia_id ? "Revisar vínculo" : "Vincular cargo"}</Button>}</div></td></tr>)}</tbody></table> : <table className="w-full min-w-[55rem] text-left text-sm"><thead className="bg-slate-100 text-xs uppercase text-slate-600"><tr><th className="px-4 py-3">Variação</th><th className="px-4 py-3">Cargo canônico</th><th className="px-4 py-3">Situação</th><th className="px-4 py-3">Criado em</th></tr></thead><tbody className="divide-y divide-slate-100">{mappings.data?.results.map((mapping) => <tr key={mapping.idmapeamentocargo}><td className="px-4 py-3 font-medium">{mapping.variacao_descricao}</td><td className="px-4 py-3">{mapping.cargo_referencia_nome}</td><td className="px-4 py-3"><StatusBadge label={mapping.flgativo ? "Ativo" : "Inativo"} active={mapping.flgativo} /></td><td className="px-4 py-3">{formatAdminDate(mapping.created_at)}</td></tr>)}</tbody></table>}
        {!loading && !error && current?.results.length === 0 && <p className="p-12 text-center text-sm text-slate-500">Nenhum registro encontrado para os filtros selecionados.</p>}
      </div>
      {current && current.count > 20 && <div className="flex items-center justify-end gap-2"><Button variant="outline" size="sm" disabled={!current.previous} onClick={() => setPage((value) => Math.max(1, value - 1))}>Anterior</Button><span className="text-sm text-slate-600">Página {page}</span><Button variant="outline" size="sm" disabled={!current.next} onClick={() => setPage((value) => value + 1)}>Próxima</Button></div>}
    </div>

    {creating && <NewCargoDialog onClose={() => setCreating(false)} onSave={async (payload) => { try { await createCargoReferencia(payload); setCreating(false); await refresh(); setFeedback({ kind: "success", message: "Cargo criado como novo. Confirme-o no catálogo antes de utilizá-lo." }); } catch (caught) { setFeedback({ kind: "error", message: getApiErrorMessage(caught, "Não foi possível criar o cargo.") }); } }} />}
    {linking && <LinkCargoDialog variation={linking} cargos={cargos.data?.results ?? []} isLoading={cargos.isLoading} error={cargos.error} patriarchId={selected?.idpatriarca ?? null} onClose={() => setLinking(null)} onCreateCargo={() => { setLinking(null); switchTab("CARGOS"); setCreating(true); }} onSave={async (scope, cargoId, confirmed) => { if (!confirmed) return; try { const selectedCargo = cargos.data?.results.find((cargo) => cargo.idcargoreferencia === cargoId); if (!selectedCargo) throw new Error("Selecione um cargo canônico disponível."); if (selectedCargo.strstatus !== "CONFIRMADO") await updateCargoReferencia(cargoId, { strstatus: "CONFIRMADO", flgativo: true }); if (scope === "GLOBAL") await updateVariacaoCargo(linking.idvariacaocargo, { idcargoreferencia_id: cargoId }); else { if (!selected) throw new Error("Selecione um patriarca."); const existing = await listMapeamentosCargo({ patriarca: selected.idpatriarca, variacao: linking.idvariacaocargo, page_size: 1 }); await saveMapeamentoCargo({ idpatriarca_id: selected.idpatriarca, idvariacaocargo_id: linking.idvariacaocargo, idcargoreferencia_id: cargoId, flgativo: true }, existing.results[0]?.idmapeamentocargo); } setLinking(null); await refresh(); setFeedback({ kind: "success", message: scope === "GLOBAL" ? "Cargo e correspondência global validados e salvos." : "Cargo e correspondência deste patriarca validados e salvos." }); } catch (caught) { setFeedback({ kind: "error", message: getApiErrorMessage(caught, "Não foi possível salvar a correspondência.") }); } }} />}
    {occurrenceVariation && <OccurrencesDialog variation={occurrenceVariation} onClose={() => setOccurrenceVariation(null)} />}
    {confirmation && <ActionConfirmation title={confirmation.title} description={confirmation.description} onCancel={() => setConfirmation(null)} onConfirm={async () => { try { await confirmation.action(); setConfirmation(null); await refresh(); setFeedback({ kind: "success", message: "Alteração validada e salva." }); } catch (caught) { setFeedback({ kind: "error", message: getApiErrorMessage(caught, "Não foi possível concluir a alteração.") }); } }} />}
  </AdminPage></RouteGuard>;
}

function NewCargoDialog({ onClose, onSave }: { onClose: () => void; onSave: (payload: { strnome: string; strdescricao: string }) => Promise<void> }) {
  const [name, setName] = useState(""); const [description, setDescription] = useState(""); const [confirmed, setConfirmed] = useState(false); const [saving, setSaving] = useState(false);
  return <Modal title="Novo cargo canônico" onClose={onClose}><p className="text-sm text-slate-600">O cargo será criado como <strong>novo</strong> e ainda precisará ser confirmado no catálogo.</p><label className="mt-4 block text-xs font-medium text-slate-600">Nome canônico<input autoFocus value={name} onChange={(event) => setName(event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label><label className="mt-3 block text-xs font-medium text-slate-600">Descrição<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="mt-1 block w-full rounded-md border border-slate-300 p-3 text-sm" /></label><label className="mt-4 flex items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1" />Revisei o nome e confirmei que este cargo ainda não existe no catálogo.</label><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button disabled={!name.trim() || !confirmed || saving} onClick={async () => { setSaving(true); await onSave({ strnome: name.trim(), strdescricao: description.trim() }); setSaving(false); }}><Plus /> Criar cargo</Button></div></Modal>;
}

function LinkCargoDialog({ variation, cargos, isLoading, error, patriarchId, onClose, onCreateCargo, onSave }: { variation: VariacaoCargo; cargos: CargoReferencia[]; isLoading: boolean; error: unknown; patriarchId: number | null; onClose: () => void; onCreateCargo: () => void; onSave: (scope: "GLOBAL" | "PATRIARCA", cargoId: number, confirmed: boolean) => Promise<void> }) {
  const [scope, setScope] = useState<"GLOBAL" | "PATRIARCA">("GLOBAL"); const [cargoId, setCargoId] = useState(variation.idcargoreferencia_id ? String(variation.idcargoreferencia_id) : ""); const [confirmed, setConfirmed] = useState(false); const [saving, setSaving] = useState(false); const selected = cargos.find((cargo) => cargo.idcargoreferencia === Number(cargoId));
  return <Modal title="Validar correspondência de cargo" onClose={onClose}><dl className="grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-2"><div><dt className="text-xs font-semibold uppercase text-slate-500">Variação encontrada</dt><dd className="mt-1 text-sm font-medium">{variation.strdescricao}</dd></div><div><dt className="text-xs font-semibold uppercase text-slate-500">Cargo canônico</dt><dd className="mt-1 text-sm font-medium">{selected?.strnome || "Selecione abaixo"}</dd></div></dl><label className="mt-4 block text-xs font-medium text-slate-600">Cargo canônico<select value={cargoId} disabled={isLoading || Boolean(error)} onChange={(event) => { setCargoId(event.target.value); setConfirmed(false); }} className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"><option value="">{isLoading ? "Carregando cargos..." : cargos.length ? "Selecione" : "Nenhum cargo ativo cadastrado"}</option>{cargos.map((cargo) => <option key={cargo.idcargoreferencia} value={cargo.idcargoreferencia}>{cargo.strnome}{cargo.strstatus !== "CONFIRMADO" ? " · novo, requer confirmação" : ""}</option>)}</select></label>{Boolean(error) && <AdminAlert variant="error">{getApiErrorMessage(error, "Não foi possível carregar os cargos canônicos.")}</AdminAlert>}{!isLoading && !error && !cargos.length && <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><span>Cadastre um cargo canônico antes de validar esta correspondência.</span><Button size="sm" variant="outline" onClick={onCreateCargo}><Plus /> Cadastrar cargo</Button></div>}{selected?.strstatus !== "CONFIRMADO" && selected && <p className="mt-2 rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-950">Este cargo ainda está como <strong>{selected.status_nome.toLocaleLowerCase("pt-BR")}</strong>. Ao confirmar abaixo, ele será validado e ficará disponível no catálogo.</p>}<fieldset className="mt-4"><legend className="text-sm font-semibold">Alcance</legend><div className="mt-2 grid gap-2 sm:grid-cols-2"><ScopeOption checked={scope === "GLOBAL"} label="Global" description="Afeta futuras análises de todos os patriarcas." onSelect={() => { setScope("GLOBAL"); setConfirmed(false); }} /><ScopeOption checked={scope === "PATRIARCA"} disabled={!patriarchId} label="Somente este patriarca" description="Cria uma exceção local com precedência sobre a global." onSelect={() => { setScope("PATRIARCA"); setConfirmed(false); }} /></div></fieldset><label className="mt-4 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1" /><span><strong>Validei o cargo, a correspondência e o alcance.</strong><span className="block text-xs">A similaridade automática é apenas uma sugestão; confirmo que o significado dos cargos é compatível{selected?.strstatus !== "CONFIRMADO" ? " e que o cargo pode ser confirmado no catálogo" : ""}.</span></span></label><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button disabled={!cargoId || !confirmed || saving || isLoading || Boolean(error)} onClick={async () => { setSaving(true); await onSave(scope, Number(cargoId), confirmed); setSaving(false); }}><ShieldCheck /> Validar e salvar</Button></div></Modal>;
}

function OccurrencesDialog({ variation, onClose }: { variation: VariacaoCargo; onClose: () => void }) { const occurrences = useSWR(["carga-org-lot:ocorrencias-cargo", variation.idvariacaocargo], () => listOcorrenciasCargo({ variacao: variation.idvariacaocargo, page_size: 100 }), { revalidateOnFocus: false }); return <Modal title={`Ocorrências de “${variation.strdescricao}”`} onClose={onClose} wide><div className="max-h-[60vh] overflow-auto rounded-lg border border-slate-200"><table className="w-full min-w-[42rem] text-left text-sm"><thead className="sticky top-0 bg-slate-100 text-xs uppercase text-slate-600"><tr><th className="px-3 py-2">Importação</th><th className="px-3 py-2">Patriarca</th><th className="px-3 py-2">Quantidade</th><th className="px-3 py-2">Localizações</th></tr></thead><tbody className="divide-y divide-slate-100">{occurrences.data?.results.map((item) => <tr key={item.idocorrenciacargo}><td className="px-3 py-2">#{item.idimportacaoplanilha_id}</td><td className="px-3 py-2">#{item.idpatriarca_id}</td><td className="px-3 py-2">{item.intquantidade}</td><td className="px-3 py-2 text-xs">{item.jsonlocalizacoes.length ? item.jsonlocalizacoes.map((value) => typeof value === "string" ? value : JSON.stringify(value)).join("; ") : "—"}</td></tr>)}</tbody></table>{occurrences.isLoading && <p className="p-8 text-center text-sm text-slate-500">Carregando ocorrências...</p>}</div><div className="mt-4 flex justify-end"><Button variant="outline" onClick={onClose}>Fechar</Button></div></Modal>; }

function ActionConfirmation({ title, description, onCancel, onConfirm }: { title: string; description: string; onCancel: () => void; onConfirm: () => Promise<void> }) { const [checked, setChecked] = useState(false); const [saving, setSaving] = useState(false); return <Modal title={title} onClose={onCancel}><p className="text-sm text-slate-600">{description}</p><label className="mt-4 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm"><input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} className="mt-1" />Revisei o impacto e confirmo esta alteração.</label><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={onCancel}>Cancelar</Button><Button disabled={!checked || saving} onClick={async () => { setSaving(true); await onConfirm(); setSaving(false); }}><ShieldCheck /> Confirmar</Button></div></Modal>; }

function Modal({ title, onClose, wide = false, children }: { title: string; onClose: () => void; wide?: boolean; children: React.ReactNode }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true"><section className={`w-full rounded-xl bg-white p-6 shadow-2xl ${wide ? "max-w-4xl" : "max-w-xl"}`}><div className="flex items-start justify-between gap-4"><h2 className="text-lg font-bold text-slate-900">{title}</h2><Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar"><X /></Button></div>{children}</section></div>; }
function ScopeOption({ checked, disabled, label, description, onSelect }: { checked: boolean; disabled?: boolean; label: string; description: string; onSelect: () => void }) { return <label className={`rounded-lg border p-3 ${checked ? "border-app-primary bg-sky-50" : "border-slate-200"} ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}><span className="flex items-center gap-2 text-sm font-semibold"><input type="radio" checked={checked} disabled={disabled} onChange={onSelect} />{label}</span><span className="mt-1 block pl-5 text-xs text-slate-500">{description}</span></label>; }
function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) { return <label className="text-xs font-medium text-slate-600">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 block min-w-48 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">{children}</select></label>; }
function StatusBadge({ label, active }: { label: string; active: boolean }) { return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${active ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>{label}</span>; }
