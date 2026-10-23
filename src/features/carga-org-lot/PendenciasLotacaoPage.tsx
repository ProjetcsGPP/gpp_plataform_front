"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Download, Eye, RefreshCw } from "lucide-react";

import { AdminAlert, AdminPage } from "@/components/admin/AdminPage";
import { RouteGuard } from "@/components/common/RouteGuard";
import { Button } from "@/components/ui/button";
import { downloadArquivo, getResumoPendencias, listCasosValidacao, listImportacoes, listItensLotacaoImportados, listItensOrganograma, pendenciasImportacaoDownloadUrl } from "@/features/carga-org-lot/api";
import { LotacoesSectionNav } from "@/features/carga-org-lot/LotacoesSectionNav";
import { ResolveCaseDialog } from "@/features/carga-org-lot/LotacaoReviewWorkspace";
import type { CasoValidacaoImportacao, ItemLotacaoImportado } from "@/features/carga-org-lot/model";
import { usePatriarcaSelection } from "@/features/carga-org-lot/usePatriarcaSelection";
import { usePermissions } from "@/hooks/usePermissions";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { PERMISSIONS } from "@/lib/permissions";

export function PendenciasLotacaoPage() {
  const { selected } = usePatriarcaSelection();
  const { can } = usePermissions();
  const { mutate: mutateCache } = useSWRConfig();
  const patriarchId = selected?.idpatriarca ?? null;
  const [importId, setImportId] = useState("");
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [status, setStatus] = useState("PENDENTE");
  const [severity, setSeverity] = useState("");
  const [organogram, setOrganogram] = useState("");
  const [setId, setSetId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [ordering, setOrdering] = useState("strseveridade,idcasovalidacao");
  const [page, setPage] = useState(1);
  const [selectedCase, setSelectedCase] = useState<CasoValidacaoImportacao | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const imports = useSWR(patriarchId ? ["carga-org-lot:importacoes-com-pendencias", patriarchId] : null, async () => {
    const [single, packaged] = await Promise.all([
      listImportacoes(patriarchId!, 4, { page_size: 100, ordering: "-datimportacao" }),
      listImportacoes(patriarchId!, 5, { page_size: 100, ordering: "-datimportacao" }),
    ]);
    return uniqueById([...single.results, ...packaged.results], (item) => item.idimportacaoplanilha)
      .filter((item) => (item.total_casos_pendentes ?? 0) > 0)
      .sort((left, right) => right.datimportacao.localeCompare(left.datimportacao));
  }, { revalidateOnFocus: false });
  const filters = { patriarca: patriarchId!, importacao: Number(importId), page, page_size: 15, ordering, ...(query.trim() ? { q: query.trim() } : {}), ...(subject ? { assunto: subject } : {}), ...(status ? { status } : {}), ...(severity ? { severidade: severity } : {}), ...(organogram ? { organograma: Number(organogram) } : {}), ...(setId ? { conjunto: Number(setId) } : {}), ...(startDate ? { data_inicio: startDate } : {}), ...(endDate ? { data_fim: endDate } : {}) };
  const list = useSWR(patriarchId && importId ? ["carga-org-lot:pendencias", filters] : null, () => listCasosValidacao(filters), { revalidateOnFocus: false });
  const summaryFilters = { patriarca: patriarchId!, importacao: Number(importId), ...(status ? { status } : {}), ...(subject ? { assunto: subject } : {}), ...(severity ? { severidade: severity } : {}), ...(organogram ? { organograma: Number(organogram) } : {}), ...(setId ? { conjunto: Number(setId) } : {}), ...(startDate ? { data_inicio: startDate } : {}), ...(endDate ? { data_fim: endDate } : {}) };
  const summary = useSWR(patriarchId && importId ? ["carga-org-lot:pendencias-resumo", summaryFilters] : null, () => getResumoPendencias(summaryFilters), { revalidateOnFocus: false });
  const organogramOptions = useMemo(
    () => uniqueById(summary.data?.por_organograma ?? [], (item) => item.idimportacaoorganograma),
    [summary.data?.por_organograma],
  );
  const setOptions = useMemo(
    () => uniqueById(summary.data?.por_conjunto ?? [], (item) => item.idconjuntolotacao),
    [summary.data?.por_conjunto],
  );
  const cases = useMemo(
    () => uniqueById(list.data?.results ?? [], (item) => item.idcasovalidacao),
    [list.data?.results],
  );

  useEffect(() => {
    if (importId && imports.data && !imports.data.some((item) => item.idimportacaoplanilha === Number(importId))) {
      setImportId("");
      setPage(1);
    }
  }, [importId, imports.data]);

  async function refreshAll() {
    await mutateCache((key) => Array.isArray(key) && ["carga-org-lot:pendencias", "carga-org-lot:pendencias-resumo", "carga-org-lot:importacoes-com-pendencias", "carga-org-lot:conjuntos", "carga-org-lot:conjuntos-resumo", "carga-org-lot:conjunto", "carga-org-lot:importacao", "carga-org-lot:itens-lotacao-importados"].includes(String(key[0])));
  }

  async function downloadPendingReport(importId: number) {
    setFeedback(null);
    try {
      await downloadArquivo(
        pendenciasImportacaoDownloadUrl(importId),
        `pendencias-importacao-${importId}.xlsx`,
      );
    } catch (caught) {
      setFeedback(getApiErrorMessage(caught, "Não foi possível baixar a planilha de pendências."));
    }
  }

  const selectedImport = imports.data?.find((item) => item.idimportacaoplanilha === Number(importId));

  return <RouteGuard permission={PERMISSIONS.IMPORTACAOPLANILHA_VIEW}><AdminPage title="Central de pendências" description="Selecione uma planilha de lotação para consultar e resolver somente as pendências daquela leitura."><div className="space-y-4"><LotacoesSectionNav />{feedback && <AdminAlert variant="error" onClose={() => setFeedback(null)}>{feedback}</AdminAlert>}
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3"><label className="min-w-72 flex-1 text-xs font-semibold text-slate-700">Planilha de lotação com pendências<select value={importId} disabled={imports.isLoading || Boolean(imports.error) || !imports.data?.length} onChange={(event) => { setImportId(event.target.value); setPage(1); setOrganogram(""); setSetId(""); }} className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"><option value="">{imports.isLoading ? "Carregando planilhas..." : "Selecione uma planilha"}</option>{imports.data?.map((item) => <option key={item.idimportacaoplanilha} value={item.idimportacaoplanilha}>{item.strreferencia || item.strnomearquivo} · {item.strnomearquivo} · {item.total_casos_pendentes} pendência(s)</option>)}</select></label>{selectedImport && <Button variant="outline" size="sm" onClick={() => void downloadPendingReport(selectedImport.idimportacaoplanilha)} title="Baixar todas as pendências abertas desta planilha"><Download /> Baixar pendências XLSX</Button>}<Button variant="outline" size="sm" onClick={() => void imports.mutate()}><RefreshCw /> Atualizar planilhas</Button></div>
    {imports.error && <AdminAlert variant="error">{getApiErrorMessage(imports.error, "Não foi possível carregar as planilhas com pendências.")}</AdminAlert>}
    {importId && <div className="flex flex-wrap gap-2"><Metric label="Total filtrado" value={summary.data?.total ?? 0} />{["CARGO", "CPF", "ORGANOGRAMA"].map((code) => { const item = summary.data?.por_assunto.find((entry) => entry.assunto === code); return <Metric key={code} label={item?.nome ?? code} value={item?.total ?? 0} />; })}</div>}
    {importId && <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"><label className="min-w-60 flex-1 text-xs font-medium text-slate-600">Pesquisa<input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Título, mensagem, arquivo ou referência" className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" /></label><Filter label="Assunto" value={subject} onChange={(value) => { setSubject(value); setPage(1); }}><option value="">Todos</option><option value="CARGO">Cargo</option><option value="CPF">CPF</option><option value="SERVIDOR">Servidor</option><option value="ORGANOGRAMA">Organograma</option><option value="ARQUIVO">Arquivo</option><option value="OUTROS">Outros</option></Filter><Filter label="Situação" value={status} onChange={(value) => { setStatus(value); setPage(1); }}><option value="">Todas</option><option value="PENDENTE">Pendentes</option><option value="CORRIGIDO">Corrigidos</option><option value="SUGESTAO_APLICADA">Sugestões aplicadas</option><option value="ACEITO_COMO_INFORMADO">Aceitos</option><option value="LINHAS_DESCARTADAS">Descartados</option></Filter><Filter label="Severidade" value={severity} onChange={(value) => { setSeverity(value); setPage(1); }}><option value="">Todas</option><option value="ERRO">Erros</option><option value="AVISO">Avisos</option></Filter><Filter label="Organograma" value={organogram} onChange={(value) => { setOrganogram(value); setPage(1); }}><option value="">Todos</option>{organogramOptions.map((item) => <option key={item.idimportacaoorganograma} value={item.idimportacaoorganograma}>{item.referencia || `#${item.idimportacaoorganograma}`}</option>)}</Filter><Filter label="Conjunto" value={setId} onChange={(value) => { setSetId(value); setPage(1); }}><option value="">Todos</option>{setOptions.map((item) => <option key={item.idconjuntolotacao} value={item.idconjuntolotacao}>{item.referencia || `#${item.idconjuntolotacao}`}</option>)}</Filter><DateField label="De" value={startDate} onChange={(value) => { setStartDate(value); setPage(1); }} /><DateField label="Até" value={endDate} onChange={(value) => { setEndDate(value); setPage(1); }} /><Filter label="Ordenação" value={ordering} onChange={setOrdering}><option value="strseveridade,idcasovalidacao">Severidade</option><option value="-idcasovalidacao">Mais recentes</option></Filter><Button variant="outline" size="sm" onClick={() => void Promise.all([list.mutate(), summary.mutate()])}><RefreshCw /> Atualizar</Button></div>}
    {!importId && !imports.isLoading && !imports.error && <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-600">{imports.data?.length ? "Selecione uma planilha para exibir suas pendências. Cada consulta e download ficará limitado a essa importação." : "Nenhuma planilha de lotação possui pendências abertas."}</div>}
    {importId && <div className="overflow-auto rounded-xl border border-slate-200 bg-white">{list.isLoading ? <Empty text="Carregando pendências..." /> : list.error ? <AdminAlert variant="error">{getApiErrorMessage(list.error, "Não foi possível carregar as pendências.")}</AdminAlert> : <table className="w-full min-w-[82rem] text-left text-sm"><thead className="bg-slate-100 text-xs uppercase text-slate-600"><tr><th className="px-4 py-3">Crítica</th><th className="px-4 py-3">Assunto</th><th className="px-4 py-3">Contexto</th><th className="px-4 py-3">Registros</th><th className="px-4 py-3">Situação</th><th className="px-4 py-3 text-right">Ação</th></tr></thead><tbody className="divide-y divide-slate-100">{cases.map((item) => <tr key={item.idcasovalidacao} className="align-top"><td className="px-4 py-3"><div className="flex gap-2"><Severity value={item.strseveridade} /><div><strong>{item.strtitulo}</strong><p className="mt-1 max-w-md text-xs text-slate-600">{item.strmensagem}</p><span className="font-mono text-[11px] text-slate-400">{item.strcodigo}</span></div></div></td><td className="px-4 py-3">{item.assunto_nome || item.assunto || "Outros"}</td><td className="px-4 py-3"><Context context={item.contexto} /></td><td className="px-4 py-3">{item.item_ids.length}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.strstatus === "PENDENTE" ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-800"}`}>{item.status_nome}</span></td><td className="px-4 py-3 text-right"><Button size="sm" variant={item.strstatus === "PENDENTE" ? "default" : "outline"} onClick={() => setSelectedCase(item)}><Eye /> {item.strstatus === "PENDENTE" ? "Revisar" : "Ver decisão"}</Button></td></tr>)}</tbody></table>}{!list.isLoading && !list.error && !cases.length && <Empty text="Nenhuma pendência encontrada para os filtros selecionados." />}</div>}{importId && list.data && list.data.count > 15 && <Pagination page={page} previous={Boolean(list.data.previous)} next={Boolean(list.data.next)} onChange={setPage} />}
  </div>{selectedCase && <CentralReview caseItem={selectedCase} canChange={can(PERMISSIONS.IMPORTACAOPLANILHA_CHANGE)} onClose={() => setSelectedCase(null)} onResolved={async () => { setSelectedCase(null); await refreshAll(); }} onError={setFeedback} />}</AdminPage></RouteGuard>;
}

function CentralReview({ caseItem, canChange, onClose, onResolved, onError }: { caseItem: CasoValidacaoImportacao; canChange: boolean; onClose: () => void; onResolved: () => Promise<void>; onError: (message: string) => void }) { const importId = caseItem.contexto?.importacao.id; const organogramId = caseItem.contexto?.organograma?.id; const items = useSWR(importId ? ["carga-org-lot:itens-lotacao-importados", importId] : null, () => listItensLotacaoImportados(importId!), { revalidateOnFocus: false }); const organs = useSWR(organogramId ? ["carga-org-lot:itens-organograma-revisao", organogramId] : null, () => listItensOrganograma(organogramId!), { revalidateOnFocus: false }); if (!items.data || (organogramId && !organs.data)) return <div className="fixed inset-0 z-50 flex cursor-wait items-center justify-center bg-slate-950/50"><div className="rounded-xl bg-white p-5 text-sm shadow-xl">Carregando dados da revisão...</div></div>; const affected = items.data.filter((item) => caseItem.item_ids.includes(item.iditemlotacaoimportado)); const originals: Record<number, Partial<ItemLotacaoImportado>> = Object.fromEntries(affected.map((item) => [item.iditemlotacaoimportado, { ...item }])); return <ResolveCaseDialog validationCase={caseItem} items={affected} originalValues={originals} organogramItems={organs.data ?? []} canChange={canChange} onClose={onClose} onResolved={onResolved} onConflict={async (message) => { onClose(); onError(`${message} Os dados foram atualizados.`); await onResolved(); }} />; }
function Context({ context }: { context?: CasoValidacaoImportacao["contexto"] }) { if (!context) return <>—</>; return <div className="min-w-60 text-xs"><strong>{context.patriarca.sigla} — {context.patriarca.nome}</strong><span className="block text-slate-600">Importação #{context.importacao.id}: {context.importacao.referencia || context.importacao.nome_arquivo}</span><span className="block text-slate-500">Organograma: {context.organograma?.referencia || context.organograma?.nome_arquivo || "—"}</span><span className="block text-slate-500">Conjunto: {context.conjunto?.referencia || "—"}</span></div>; }
function Metric({ label, value }: { label: string; value: number }) { return <div className="min-w-28 max-w-40 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2"><p className="text-[10px] font-semibold uppercase leading-tight text-slate-500">{label}</p><p className="mt-0.5 text-lg font-bold leading-none">{value}</p></div>; }
function Filter({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) { return <label className="text-xs font-medium text-slate-600">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 block min-w-40 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">{children}</select></label>; }
function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="text-xs font-medium text-slate-600">{label}<input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 block rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" /></label>; }
function Severity({ value }: { value: "ERRO" | "AVISO" }) { return <span className={`h-fit rounded-full px-2 py-1 text-xs font-semibold ${value === "ERRO" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-900"}`}>{value === "ERRO" ? "Erro" : "Aviso"}</span>; }
function Empty({ text }: { text: string }) { return <p className="p-8 text-center text-sm text-slate-500">{text}</p>; }
function Pagination({ page, previous, next, onChange }: { page: number; previous: boolean; next: boolean; onChange: (page: number) => void }) { return <div className="flex justify-end gap-2"><Button variant="outline" size="sm" disabled={!previous} onClick={() => onChange(page - 1)}>Anterior</Button><span className="px-2 py-2 text-sm">Página {page}</span><Button variant="outline" size="sm" disabled={!next} onClick={() => onChange(page + 1)}>Próxima</Button></div>; }

function uniqueById<T>(items: T[], getId: (item: T) => number | null | undefined) {
  const unique = new Map<number, T>();
  for (const item of items) {
    const id = getId(item);
    if (id !== null && id !== undefined && !unique.has(id)) unique.set(id, item);
  }
  return Array.from(unique.values());
}
