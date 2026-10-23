"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR, { useSWRConfig } from "swr";
import { CheckCircle2, Download, Eye, FilePlus2, Power, RefreshCw, ShieldCheck, X, XCircle } from "lucide-react";

import { AdminAlert, AdminPage } from "@/components/admin/AdminPage";
import { RouteGuard } from "@/components/common/RouteGuard";
import { Button } from "@/components/ui/button";
import {
  ativarConjuntoLotacao,
  cancelarConjuntoLotacao,
  downloadArquivo,
  getConjuntoLotacao,
  getResumoConjuntosLotacao,
  homologarConjuntoLotacao,
  listConjuntosLotacao,
  listHistoricoConjuntoLotacao,
  listImportacoes,
} from "@/features/carga-org-lot/api";
import { LotacoesSectionNav } from "@/features/carga-org-lot/LotacoesSectionNav";
import type { ConjuntoLotacao, SituacaoConjuntoLotacao } from "@/features/carga-org-lot/model";
import { usePatriarcaSelection } from "@/features/carga-org-lot/usePatriarcaSelection";
import { usePermissions } from "@/hooks/usePermissions";
import { formatAdminDate } from "@/lib/adminResource";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { PERMISSIONS } from "@/lib/permissions";

const situations: Array<[SituacaoConjuntoLotacao, string]> = [
  ["RASCUNHO", "Rascunho"], ["EM_VALIDACAO", "Em validação"],
  ["COM_PENDENCIAS", "Com pendências"], ["PRONTO_PARA_HOMOLOGACAO", "Pronto para homologação"],
  ["HOMOLOGADO", "Homologado"], ["ATIVO", "Ativo"],
  ["CANCELADO", "Cancelado"], ["SUBSTITUIDO", "Substituído"],
];

export function ConjuntosLotacaoPage() {
  const { selected } = usePatriarcaSelection();
  const { can } = usePermissions();
  const { mutate: mutateCache } = useSWRConfig();
  const patriarchId = selected?.idpatriarca ?? null;
  const [reference, setReference] = useState("");
  const [organogram, setOrganogram] = useState("");
  const [situation, setSituation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  const [page, setPage] = useState(1);
  const [selectedSet, setSelectedSet] = useState<ConjuntoLotacao | null>(null);
  const [transition, setTransition] = useState<"homologar" | "ativar" | "cancelar" | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "error" | "success"; message: string } | null>(null);
  const params = { patriarca: patriarchId!, page, page_size: 15, ordering, ...(reference.trim() ? { referencia: reference.trim() } : {}), ...(organogram ? { organograma: Number(organogram) } : {}), ...(situation ? { situacao: situation } : {}), ...(startDate ? { data_inicio: startDate } : {}), ...(endDate ? { data_fim: endDate } : {}) };
  const list = useSWR(patriarchId ? ["carga-org-lot:conjuntos", params] : null, () => listConjuntosLotacao(params), { revalidateOnFocus: false });
  const summary = useSWR(patriarchId ? ["carga-org-lot:conjuntos-resumo", patriarchId] : null, () => getResumoConjuntosLotacao({ patriarca: patriarchId! }), { revalidateOnFocus: false });
  const organograms = useSWR(patriarchId ? ["carga-org-lot:organogramas-conjuntos", patriarchId] : null, () => listImportacoes(patriarchId!, 3, { page_size: 100, ordering: "-datimportacao" }), { revalidateOnFocus: false });

  async function refreshAll() {
    await mutateCache((key) => Array.isArray(key) && ["carga-org-lot:conjuntos", "carga-org-lot:conjuntos-resumo", "carga-org-lot:conjunto", "carga-org-lot:conjunto-historico", "carga-org-lot:importacoes-conjunto"].includes(String(key[0])));
  }

  return <RouteGuard permission={PERMISSIONS.IMPORTACAOPLANILHA_VIEW}><AdminPage title="Conjuntos de lotação" description="Acompanhe cada consolidação desde a validação das planilhas até a homologação e ativação.">
    <div className="space-y-4"><LotacoesSectionNav />
      {feedback && <AdminAlert variant={feedback.kind} onClose={() => setFeedback(null)}>{feedback.message}</AdminAlert>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Total" value={summary.data?.total_conjuntos ?? 0} />{["EM_VALIDACAO", "COM_PENDENCIAS", "PRONTO_PARA_HOMOLOGACAO", "ATIVO"].map((value) => { const item = summary.data?.por_situacao.find((entry) => entry.situacao === value); return <Metric key={value} label={item?.nome ?? situations.find(([code]) => code === value)?.[1] ?? value} value={item?.total ?? 0} tone={value === "COM_PENDENCIAS" ? "warning" : value === "ATIVO" ? "success" : undefined} />; })}</div>
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"><label className="min-w-60 flex-1 text-xs font-medium text-slate-600">Referência<input value={reference} onChange={(event) => { setReference(event.target.value); setPage(1); }} placeholder="Buscar pela referência" className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" /></label><Select label="Organograma" value={organogram} onChange={(value) => { setOrganogram(value); setPage(1); }}><option value="">Todos</option>{organograms.data?.results.map((item) => <option key={item.idimportacaoplanilha} value={item.idimportacaoplanilha}>{item.strreferencia || item.strnomearquivo} · {item.status_importacao_nome}</option>)}</Select><Select label="Situação" value={situation} onChange={(value) => { setSituation(value); setPage(1); }}><option value="">Todas</option>{situations.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select><DateField label="Criado a partir de" value={startDate} onChange={(value) => { setStartDate(value); setPage(1); }} /><DateField label="Até" value={endDate} onChange={(value) => { setEndDate(value); setPage(1); }} /><Select label="Ordenação" value={ordering} onChange={setOrdering}><option value="-created_at">Mais recentes</option><option value="created_at">Mais antigos</option><option value="-updated_at">Atualizados recentemente</option></Select><Button variant="outline" size="sm" onClick={() => void Promise.all([list.mutate(), summary.mutate(), organograms.mutate()])}><RefreshCw /> Atualizar</Button></div>
      <div className="overflow-auto rounded-xl border border-slate-200 bg-white">{list.isLoading ? <Empty text="Carregando conjuntos..." /> : list.error ? <AdminAlert variant="error">{getApiErrorMessage(list.error, "Não foi possível carregar os conjuntos.")}</AdminAlert> : <table className="w-full min-w-[78rem] text-left text-sm"><thead className="bg-slate-100 text-xs uppercase text-slate-600"><tr><th className="px-4 py-3">Conjunto</th><th className="px-4 py-3">Organograma</th><th className="px-4 py-3">Situação</th><th className="px-4 py-3">Planilhas</th><th className="px-4 py-3">Registros</th><th className="px-4 py-3">Pendências</th><th className="px-4 py-3">Atualização</th><th className="px-4 py-3 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-100">{list.data?.results.map((set) => <tr key={set.idconjuntolotacao}><td className="px-4 py-3"><strong>{set.strreferencia || `Conjunto #${set.idconjuntolotacao}`}</strong><span className="block text-xs text-slate-500">#{set.idconjuntolotacao} · {set.patriarca_resumo.sigla}</span></td><td className="px-4 py-3">{set.organograma_resumo.referencia || set.organograma_resumo.nome_arquivo}<span className="block text-xs text-slate-500">#{set.organograma_resumo.idimportacaoplanilha}</span></td><td className="px-4 py-3"><SituationBadge set={set} /></td><td className="px-4 py-3">{set.total_importacoes}</td><td className="px-4 py-3">{set.total_registros}</td><td className="px-4 py-3"><span className={set.total_casos_pendentes ? "font-semibold text-amber-700" : "text-slate-600"}>{set.total_casos_pendentes}</span></td><td className="px-4 py-3">{formatAdminDate(set.updated_at)}</td><td className="px-4 py-3"><div className="flex justify-end gap-1"><Button variant="ghost" size="sm" onClick={() => setSelectedSet(set)}><Eye /> Detalhes</Button>{set.acoes_disponiveis.adicionar_planilha.permitida && can(PERMISSIONS.IMPORTACAOPLANILHA_ADD) && <Button variant="ghost" size="sm" asChild><Link href={`/carga-org-lot/lotacoes/importar?organograma=${set.idimportacaoorganograma_id}&conjunto=${set.idconjuntolotacao}`}><FilePlus2 /> Planilha</Link></Button>}</div></td></tr>)}</tbody></table>}{!list.isLoading && !list.error && !list.data?.results.length && <Empty text="Nenhum conjunto encontrado para os filtros selecionados." />}</div>
      {list.data && list.data.count > 15 && <Pagination page={page} previous={Boolean(list.data.previous)} next={Boolean(list.data.next)} onChange={setPage} />}
    </div>
    {selectedSet && <SetDetailDialog initial={selectedSet} canAdd={can(PERMISSIONS.IMPORTACAOPLANILHA_ADD)} canChange={can(PERMISSIONS.IMPORTACAOPLANILHA_CHANGE)} onClose={() => setSelectedSet(null)} onTransition={setTransition} />}
    {selectedSet && transition && <TransitionDialog action={transition} set={selectedSet} onCancel={() => setTransition(null)} onConfirm={async (justification) => { try { const updated = transition === "homologar" ? await homologarConjuntoLotacao(selectedSet.idconjuntolotacao, justification) : transition === "ativar" ? await ativarConjuntoLotacao(selectedSet.idconjuntolotacao, justification) : await cancelarConjuntoLotacao(selectedSet.idconjuntolotacao, justification); setSelectedSet(updated); setTransition(null); await refreshAll(); setFeedback({ kind: "success", message: `Conjunto ${updated.situacao_nome.toLocaleLowerCase("pt-BR")}.` }); } catch (caught) { setTransition(null); setFeedback({ kind: "error", message: getApiErrorMessage(caught, "Não foi possível concluir a transição do conjunto.") }); } }} />}
  </AdminPage></RouteGuard>;
}

function SetDetailDialog({ initial, canAdd, canChange, onClose, onTransition }: { initial: ConjuntoLotacao; canAdd: boolean; canChange: boolean; onClose: () => void; onTransition: (action: "homologar" | "ativar" | "cancelar") => void }) {
  const detail = useSWR(["carga-org-lot:conjunto", initial.idconjuntolotacao], () => getConjuntoLotacao(initial.idconjuntolotacao), { fallbackData: initial, revalidateOnFocus: false });
  const history = useSWR(["carga-org-lot:conjunto-historico", initial.idconjuntolotacao], () => listHistoricoConjuntoLotacao(initial.idconjuntolotacao, { page_size: 100 }), { revalidateOnFocus: false });
  const imports = useSWR(["carga-org-lot:importacoes-conjunto", initial.idconjuntolotacao], async () => {
    const [single, packaged] = await Promise.all([
      listImportacoes(initial.idpatriarca_id, 4, { conjunto_lotacao: initial.idconjuntolotacao, page_size: 100 }),
      listImportacoes(initial.idpatriarca_id, 5, { conjunto_lotacao: initial.idconjuntolotacao, page_size: 100 }),
    ]);
    const results = Array.from(
      new Map(
        [...single.results, ...packaged.results].map((item) => [
          item.idimportacaoplanilha,
          item,
        ]),
      ).values(),
    ).sort((left, right) => right.datimportacao.localeCompare(left.datimportacao));
    return { ...single, count: results.length, results };
  }, { revalidateOnFocus: false });
  const set = detail.data ?? initial;
  const addAvailability = set.acoes_disponiveis.adicionar_planilha;
  const addDisabledReason = !canAdd ? "Seu usuário não possui permissão para adicionar planilhas." : addAvailability.motivo;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="set-detail-title"><section className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"><header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5"><div><h2 id="set-detail-title" className="text-lg font-bold">{set.strreferencia || `Conjunto #${set.idconjuntolotacao}`}</h2><p className="text-sm text-slate-600">{set.organograma_resumo.referencia || set.organograma_resumo.nome_arquivo} · {set.patriarca_resumo.sigla}</p></div><Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar"><X /></Button></header><div className="min-h-0 flex-1 space-y-5 overflow-auto p-5"><div className="flex flex-wrap items-center gap-2"><SituationBadge set={set} /><span className="text-sm text-slate-500">{set.total_importacoes} planilha(s) · {set.total_registros} registros · {set.total_casos_pendentes} pendências · {set.total_registros_descartados} descartados</span></div><SetPhases situation={set.strsituacao} /><section><h3 className="font-semibold">Ações do conjunto</h3><div className="mt-2 flex flex-wrap items-start gap-2"><span>{canAdd && addAvailability.permitida ? <Button variant="outline" asChild><Link href={`/carga-org-lot/lotacoes/importar?organograma=${set.idimportacaoorganograma_id}&conjunto=${set.idconjuntolotacao}`}><FilePlus2 /> Adicionar planilha</Link></Button> : <Button variant="outline" disabled><FilePlus2 /> Adicionar planilha</Button>}{(!canAdd || !addAvailability.permitida) && addDisabledReason && <span className="mt-1 block max-w-56 text-xs text-slate-500">{addDisabledReason}</span>}</span><ActionButton action="homologar" label="Homologar" icon={<ShieldCheck />} set={set} canChange={canChange} onClick={() => onTransition("homologar")} /><ActionButton action="ativar" label="Ativar" icon={<Power />} set={set} canChange={canChange} onClick={() => onTransition("ativar")} /><ActionButton action="cancelar" label="Cancelar" icon={<XCircle />} set={set} canChange={canChange} onClick={() => onTransition("cancelar")} /><Button variant="outline" onClick={() => void downloadArquivo(set.download_consolidado_url, `lotacoes_consolidadas_${set.idconjuntolotacao}.xlsx`)}><Download /> Consolidado</Button></div></section><section><h3 className="font-semibold">Planilhas</h3><div className="mt-2 overflow-auto rounded-lg border border-slate-200"><table className="w-full text-sm"><thead className="bg-slate-100 text-xs uppercase text-slate-600"><tr><th className="px-3 py-2 text-left">Referência</th><th className="px-3 py-2 text-left">Arquivo</th><th className="px-3 py-2 text-left">Status</th><th className="px-3 py-2 text-left">Data</th></tr></thead><tbody>{imports.data?.results.map((item) => <tr key={item.idimportacaoplanilha} className="border-t"><td className="px-3 py-2">{item.strreferencia || "—"}</td><td className="px-3 py-2">{item.strnomearquivo}</td><td className="px-3 py-2">{item.status_importacao_nome}</td><td className="px-3 py-2">{formatAdminDate(item.datimportacao)}</td></tr>)}</tbody></table>{!imports.data?.results.length && <Empty text="Nenhuma planilha no conjunto." />}</div></section><section><h3 className="font-semibold">Histórico</h3><div className="mt-2 space-y-2">{history.data?.results.map((entry) => <div key={entry.idhistoricoconjuntolotacao} className="rounded-lg border border-slate-200 p-3 text-sm"><strong>{entry.strmensagem || entry.stracao}</strong><span className="mt-1 block text-xs text-slate-500">{formatAdminDate(entry.created_at)} · {entry.created_by_name || "Usuário não informado"}</span>{entry.strsituacaoanterior && <span className="mt-1 block text-xs">{entry.strsituacaoanterior} → {entry.strsituacaonova}</span>}</div>)}</div></section></div></section></div>;
}

function ActionButton({ action, label, icon, set, canChange, onClick }: { action: "homologar" | "ativar" | "cancelar"; label: string; icon: React.ReactNode; set: ConjuntoLotacao; canChange: boolean; onClick: () => void }) { const availability = set.acoes_disponiveis[action]; const disabled = !canChange || !availability.permitida; const reason = !canChange ? "Seu usuário não possui permissão para esta ação." : availability.motivo; return <span title={disabled ? reason : undefined}><Button variant={action === "cancelar" ? "destructive" : "default"} disabled={disabled} onClick={onClick}>{icon}{label}</Button>{disabled && reason && <span className="mt-1 block max-w-56 text-xs text-slate-500">{reason}</span>}</span>; }
function TransitionDialog({ action, set, onCancel, onConfirm }: { action: "homologar" | "ativar" | "cancelar"; set: ConjuntoLotacao; onCancel: () => void; onConfirm: (justification: string) => Promise<void> }) { const [justification, setJustification] = useState(""); const [confirmed, setConfirmed] = useState(false); const [saving, setSaving] = useState(false); const label = action === "homologar" ? "Homologar" : action === "ativar" ? "Ativar" : "Cancelar"; return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="transition-title"><section className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl"><h2 id="transition-title" className="text-lg font-bold">{label} conjunto</h2><p className="mt-2 text-sm text-slate-600">{set.strreferencia || `Conjunto #${set.idconjuntolotacao}`}. Esta ação será registrada no histórico.</p><label className="mt-4 block text-xs font-medium text-slate-600">Justificativa<textarea value={justification} onChange={(event) => setJustification(event.target.value)} rows={3} className="mt-1 block w-full rounded-md border border-slate-300 p-3 text-sm" /></label><label className="mt-4 flex gap-2 rounded-lg border border-slate-200 p-3 text-sm"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1" />Revisei a situação e confirmo a ação de {label.toLocaleLowerCase("pt-BR")}.</label><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={onCancel}>Voltar</Button><Button variant={action === "cancelar" ? "destructive" : "default"} disabled={!justification.trim() || !confirmed || saving} onClick={async () => { setSaving(true); await onConfirm(justification.trim()); setSaving(false); }}><CheckCircle2 /> Confirmar</Button></div></section></div>; }
function SetPhases({ situation }: { situation: SituacaoConjuntoLotacao }) { const phases = ["Conjunto criado", "Planilha recebida", "Validação estrutural", "Análise de cargos", "Revisão", "Incorporação", "Pronto para homologar", "Homologação", "Ativação", "Histórico / substituição"]; const currentBySituation: Record<SituacaoConjuntoLotacao, number> = { RASCUNHO: 0, EM_VALIDACAO: 3, COM_PENDENCIAS: 4, PRONTO_PARA_HOMOLOGACAO: 6, HOMOLOGADO: 7, ATIVO: 8, CANCELADO: 9, SUBSTITUIDO: 9 }; const current = currentBySituation[situation]; return <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{phases.map((label, index) => <li key={label} className={`rounded-lg border p-2 text-center text-xs font-semibold ${index <= current ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-500"}`}>{index + 1}. {label}</li>)}</ol>; }
function SituationBadge({ set }: { set: ConjuntoLotacao }) { const color = set.strsituacao === "ATIVO" ? "bg-emerald-100 text-emerald-800" : set.strsituacao === "COM_PENDENCIAS" ? "bg-amber-100 text-amber-900" : ["CANCELADO", "SUBSTITUIDO"].includes(set.strsituacao) ? "bg-slate-200 text-slate-700" : "bg-sky-100 text-sky-800"; return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>{set.situacao_nome}</span>; }
function Metric({ label, value, tone }: { label: string; value: number; tone?: "warning" | "success" }) { return <div className={`rounded-xl border p-4 ${tone === "warning" ? "border-amber-200 bg-amber-50" : tone === "success" ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-900">{value}</p></div>; }
function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) { return <label className="text-xs font-medium text-slate-600">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 block min-w-48 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">{children}</select></label>; }
function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="text-xs font-medium text-slate-600">{label}<input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 block rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" /></label>; }
function Empty({ text }: { text: string }) { return <p className="p-8 text-center text-sm text-slate-500">{text}</p>; }
function Pagination({ page, previous, next, onChange }: { page: number; previous: boolean; next: boolean; onChange: (page: number) => void }) { return <div className="flex justify-end gap-2"><Button variant="outline" size="sm" disabled={!previous} onClick={() => onChange(page - 1)}>Anterior</Button><span className="px-2 py-2 text-sm">Página {page}</span><Button variant="outline" size="sm" disabled={!next} onClick={() => onChange(page + 1)}>Próxima</Button></div>; }
