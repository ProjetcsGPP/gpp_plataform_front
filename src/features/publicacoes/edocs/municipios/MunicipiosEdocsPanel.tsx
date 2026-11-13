"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { FileClock, History, MapPinned, Pencil, Plus } from "lucide-react";

import { AdminDataTable, type AdminTableColumn } from "@/components/admin/AdminDataTable";
import { AdminAlert } from "@/components/admin/AdminPage";
import { Button } from "@/components/ui/button";
import {
  alterarSituacaoMunicipioEdocs,
  cadastrarMunicipioEdocs,
  corrigirCadastroMunicipioEdocs,
  listAuditoriaMunicipiosEdocs,
  listMunicipiosIbge,
  listMunicipiosEdocs,
} from "@/features/publicacoes/edocs/api";
import { EDOCS_ACTIONS, hasEdocsAction } from "@/features/publicacoes/edocs/actions";
import { edocsCacheKeys, revalidateEdocsCaches } from "@/features/publicacoes/edocs/cache";
import {
  EdocsFilters,
  EdocsJsonBlock,
  EdocsModal,
  EdocsStatusBadge,
  EdocsTextFilter,
} from "@/features/publicacoes/edocs/EdocsUi";
import type {
  AlteracaoSituacaoMunicipioEdocsPayload,
  CorrecaoMunicipioEdocsPayload,
  CriacaoMunicipioEdocsPayload,
  EventoAuditoriaMunicipioEdocs,
  MunicipioEdocs,
  SituacaoMunicipioEdocs,
} from "@/features/publicacoes/edocs/model";
import { edocsOrdering, nextEdocsSorting } from "@/features/publicacoes/edocs/table";
import { usePermissions } from "@/hooks/usePermissions";
import { formatAdminDate } from "@/lib/adminResource";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { PERMISSIONS } from "@/lib/permissions";
import type { AdminSortRule, AdminTableDensity } from "@/types/admin";

const SITUACOES: readonly { value: SituacaoMunicipioEdocs; label: string }[] = [
  { value: "SEM_DADOS", label: "Sem dados" },
  { value: "MANIFESTOU_INTERESSE", label: "Manifestou interesse" },
  { value: "EM_IMPLANTACAO", label: "Em implantação" },
  { value: "IMPLANTADO_SEM_USO_EDOCS", label: "Implantado sem uso do E-Docs" },
];

type SortKey = "nome" | "codigo_ibge" | "ativo" | "atualizado_em";
type Editor = { mode: "create" } | { mode: "correct" | "status"; municipio: MunicipioEdocs };

export function MunicipiosEdocsPanel() {
  const { can } = usePermissions();
  const { mutate: mutateCache } = useSWRConfig();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [density, setDensity] = useState<AdminTableDensity>("compact");
  const [sorting, setSorting] = useState<AdminSortRule<SortKey>[]>([
    { key: "nome", direction: "asc" },
  ]);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [history, setHistory] = useState<MunicipioEdocs | null>(null);
  const [audit, setAudit] = useState<MunicipioEdocs | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "error" | "success"; message: string } | null>(null);
  const ordering = edocsOrdering(sorting);
  const key = edocsCacheKeys.municipios([page, pageSize, search, ordering]);
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    () => listMunicipiosEdocs({
      page,
      page_size: pageSize,
      ordering,
      search: search.trim() || undefined,
    }),
    { keepPreviousData: true, revalidateOnFocus: false },
  );

  async function finishMutation(message: string) {
    setEditor(null);
    await revalidateEdocsCaches(mutateCache);
    setFeedback({ kind: "success", message });
  }

  async function mutationFailed(caught: unknown, fallback: string) {
    setEditor(null);
    setFeedback({ kind: "error", message: getApiErrorMessage(caught, fallback) });
    await revalidateEdocsCaches(mutateCache);
  }

  const columns: AdminTableColumn<MunicipioEdocs, SortKey>[] = [
    { key: "codigo", label: "Código IBGE", sortKey: "codigo_ibge", className: "font-mono", render: (row) => row.codigo_ibge },
    { key: "nome", label: "Município", sortKey: "nome", className: "font-medium", render: (row) => row.nome },
    {
      key: "situacao",
      label: "Situação vigente",
      render: (row) => row.situacao_atual ? (
        <div><EdocsStatusBadge>{situacaoLabel(row.situacao_atual.situacao)}</EdocsStatusBadge><span className="mt-1 block text-xs text-slate-500">Desde {row.situacao_atual.competencia_inicio}</span></div>
      ) : <span className="text-xs text-slate-500">Sem vigência</span>,
    },
    {
      key: "patriarca",
      label: "Patriarca associado",
      render: (row) => row.patriarca_edocs ? (
        <div><strong>{row.patriarca_edocs.sigla}</strong><span className="block text-xs text-slate-500">{row.patriarca_edocs.nome}</span></div>
      ) : <span className="text-xs text-slate-500">Ainda não associado</span>,
    },
    { key: "atualizado", label: "Atualizado em", sortKey: "atualizado_em", render: (row) => formatAdminDate(row.atualizado_em) },
    {
      key: "acoes", label: "Ações", headerClassName: "text-right", className: "text-right",
      render: (row) => {
        const canCorrect = can(PERMISSIONS.EDOCS_MUNICIPIO_CHANGE)
          && hasEdocsAction(row.acoes_disponiveis, EDOCS_ACTIONS.CORRIGIR_CADASTRO_MUNICIPIO);
        const canChangeStatus = can(PERMISSIONS.EDOCS_MUNICIPIO_SITUACAO_ALTERAR)
          && hasEdocsAction(row.acoes_disponiveis, EDOCS_ACTIONS.ALTERAR_SITUACAO_MUNICIPIO);
        return <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setHistory(row)}><History aria-hidden="true" /> Vigências</Button>
          {can(PERMISSIONS.EDOCS_MUNICIPIO_AUDITORIA_VIEW) && <Button variant="outline" size="sm" onClick={() => setAudit(row)}><FileClock aria-hidden="true" /> Auditoria</Button>}
          {canCorrect && <Button variant="outline" size="sm" onClick={() => setEditor({ mode: "correct", municipio: row })}><Pencil aria-hidden="true" /> Corrigir</Button>}
          {canChangeStatus && <Button size="sm" onClick={() => setEditor({ mode: "status", municipio: row })}><MapPinned aria-hidden="true" /> Nova situação</Button>}
        </div>;
      },
    },
  ];

  return <section aria-labelledby="municipios-edocs-title">
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div><h2 id="municipios-edocs-title" className="text-lg font-semibold">Cadastro municipal E-Docs</h2><p className="text-sm text-slate-600">Cadastro independente de municípios, com situação por competência. A associação ao patriarca ocorre pelo código IBGE real.</p></div>
      {can(PERMISSIONS.EDOCS_MUNICIPIO_ADD) && <Button onClick={() => setEditor({ mode: "create" })}><Plus aria-hidden="true" /> Cadastrar município</Button>}
    </div>
    {feedback && <div className="mb-4"><AdminAlert variant={feedback.kind} onClose={() => setFeedback(null)}>{feedback.message}</AdminAlert></div>}
    <EdocsFilters><EdocsTextFilter label="Pesquisar" value={search} placeholder="Nome ou código IBGE" onChange={(value) => { setSearch(value); setPage(1); }} /></EdocsFilters>
    <AdminDataTable rows={data?.results ?? []} columns={columns} getRowKey={(row) => row.id} sorting={sorting} onSort={(sortKey, additive) => { setPage(1); setSorting((current) => nextEdocsSorting(current, sortKey, additive)); }} page={page} pageSize={pageSize} pageSizeOptions={[10, 20, 50]} totalCount={data?.count ?? 0} hasPreviousPage={Boolean(data?.previous)} hasNextPage={Boolean(data?.next)} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1); }} density={density} onDensityChange={setDensity} onResetView={() => { setSorting([{ key: "nome", direction: "asc" }]); setDensity("compact"); }} isLoading={isLoading} isRefreshing={isValidating && Boolean(data)} errorMessage={error ? getApiErrorMessage(error, "Não foi possível carregar os municípios.") : null} onRetry={() => mutate()} emptyMessage="Nenhum município cadastrado." />

    {editor?.mode === "create" && <MunicipioCreateDialog onClose={() => setEditor(null)} onSave={async (payload) => { try { await cadastrarMunicipioEdocs(payload); await finishMutation("Município cadastrado com vigência e auditoria."); } catch (caught) { await mutationFailed(caught, "Não foi possível cadastrar o município."); } }} />}
    {editor?.mode === "correct" && <MunicipioCorrectionDialog municipio={editor.municipio} onClose={() => setEditor(null)} onSave={async (payload) => { try { await corrigirCadastroMunicipioEdocs(editor.municipio.id, payload); await finishMutation("Cadastro municipal corrigido e auditado."); } catch (caught) { await mutationFailed(caught, "Não foi possível corrigir o município."); } }} />}
    {editor?.mode === "status" && <MunicipioStatusDialog municipio={editor.municipio} onClose={() => setEditor(null)} onSave={async (payload) => { try { await alterarSituacaoMunicipioEdocs(editor.municipio.id, payload); await finishMutation("Nova situação municipal registrada."); } catch (caught) { await mutationFailed(caught, "Não foi possível alterar a situação municipal."); } }} />}
    {history && <MunicipioHistoryDialog municipio={history} onClose={() => setHistory(null)} />}
    {audit && <MunicipioAuditDialog municipio={audit} onClose={() => setAudit(null)} />}
  </section>;
}

function situacaoLabel(value: SituacaoMunicipioEdocs) {
  return SITUACOES.find((item) => item.value === value)?.label ?? value;
}

function CompetenceFields({ year, month, onYear, onMonth }: { year: string; month: string; onYear: (value: string) => void; onMonth: (value: string) => void }) {
  return <div className="grid grid-cols-2 gap-3"><label className="text-xs font-medium text-slate-600">Ano inicial<input className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" type="number" min={2024} value={year} onChange={(event) => onYear(event.target.value)} /></label><label className="text-xs font-medium text-slate-600">Mês inicial<select className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" value={month} onChange={(event) => onMonth(event.target.value)}><option value="">Selecione</option>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{String(index + 1).padStart(2, "0")}</option>)}</select></label></div>;
}

function MunicipioIbgeField({ value, onChange, current }: { value: string; onChange: (value: string) => void; current?: { codigo_ibge: number; nome: string } }) {
  const { data, error, isLoading, mutate } = useSWR(
    edocsCacheKeys.municipiosIbge(),
    listMunicipiosIbge,
    { revalidateOnFocus: false },
  );
  const options = current && !data?.some((item) => item.codigo_ibge === current.codigo_ibge)
    ? [current, ...(data ?? [])]
    : data;
  return <div><label className="block text-xs font-medium text-slate-600">Município<select className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" value={value} onChange={(event) => onChange(event.target.value)} disabled={isLoading || Boolean(error)}><option value="">{isLoading ? "Carregando municípios..." : "Selecione"}</option>{options?.map((item) => <option key={item.codigo_ibge} value={item.codigo_ibge}>{item.nome} — {item.codigo_ibge}</option>)}</select></label>{error && <AdminAlert><div className="flex items-center justify-between gap-3"><span>{getApiErrorMessage(error, "Não foi possível carregar os municípios do IBGE.")}</span><Button size="sm" variant="outline" onClick={() => mutate()}>Tentar novamente</Button></div></AdminAlert>}</div>;
}

function JustificationField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <label className="block text-xs font-medium text-slate-600">Justificativa<textarea className="mt-1 block w-full rounded-md border p-3 text-sm" rows={3} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function MunicipioCreateDialog({ onClose, onSave }: { onClose: () => void; onSave: (payload: CriacaoMunicipioEdocsPayload) => Promise<void> }) {
  const [municipalityCode, setMunicipalityCode] = useState(""); const [status, setStatus] = useState<SituacaoMunicipioEdocs>("SEM_DADOS"); const [year, setYear] = useState(""); const [month, setMonth] = useState(""); const [justification, setJustification] = useState(""); const [saving, setSaving] = useState(false);
  const { data: municipalities } = useSWR(edocsCacheKeys.municipiosIbge(), listMunicipiosIbge, { revalidateOnFocus: false });
  const municipality = municipalities?.find((item) => item.codigo_ibge === Number(municipalityCode));
  const valid = municipality && Number(year) >= 2024 && Number(month) >= 1 && justification.trim();
  return <EdocsModal title="Cadastrar município" onClose={onClose} wide><div className="mt-4 space-y-4"><p className="text-sm text-slate-600">Selecione um município ainda não cadastrado. A associação futura ao patriarca será feita pelo código IBGE.</p><MunicipioIbgeField value={municipalityCode} onChange={setMunicipalityCode} /><label className="block text-xs font-medium text-slate-600">Situação inicial<select className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" value={status} onChange={(event) => setStatus(event.target.value as SituacaoMunicipioEdocs)}>{SITUACOES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><CompetenceFields year={year} month={month} onYear={setYear} onMonth={setMonth} /><JustificationField value={justification} onChange={setJustification} /><DialogActions saving={saving} valid={Boolean(valid)} onClose={onClose} onSubmit={async () => { if (!municipality) return; setSaving(true); try { await onSave({ codigo_ibge: municipality.codigo_ibge, nome: municipality.nome, situacao: status, ano_inicio: Number(year), mes_inicio: Number(month), justificativa: justification.trim() }); } finally { setSaving(false); } }} /></div></EdocsModal>;
}

function MunicipioCorrectionDialog({ municipio, onClose, onSave }: { municipio: MunicipioEdocs; onClose: () => void; onSave: (payload: CorrecaoMunicipioEdocsPayload) => Promise<void> }) {
  const [municipalityCode, setMunicipalityCode] = useState(String(municipio.codigo_ibge)); const [justification, setJustification] = useState(""); const [saving, setSaving] = useState(false);
  const { data: municipalities } = useSWR(edocsCacheKeys.municipiosIbge(), listMunicipiosIbge, { revalidateOnFocus: false });
  const selected = municipalities?.find((item) => item.codigo_ibge === Number(municipalityCode))
    ?? (Number(municipalityCode) === municipio.codigo_ibge
      ? { codigo_ibge: municipio.codigo_ibge, nome: municipio.nome }
      : undefined);
  const changed = selected && (selected.codigo_ibge !== municipio.codigo_ibge || selected.nome !== municipio.nome);
  return <EdocsModal title="Corrigir cadastro municipal" onClose={onClose} wide><div className="mt-4 space-y-4"><p className="text-sm text-slate-600">Selecione a referência oficial correta. Correção protegida pela versão {municipio.versao}; a situação e seu histórico não serão reescritos.</p><MunicipioIbgeField value={municipalityCode} onChange={setMunicipalityCode} current={{ codigo_ibge: municipio.codigo_ibge, nome: municipio.nome }} /><JustificationField value={justification} onChange={setJustification} /><DialogActions saving={saving} valid={Boolean(selected && changed && justification.trim())} onClose={onClose} onSubmit={async () => { if (!selected) return; setSaving(true); try { await onSave({ codigo_ibge: selected.codigo_ibge, nome: selected.nome, versao: municipio.versao, justificativa: justification.trim() }); } finally { setSaving(false); } }} /></div></EdocsModal>;
}

function MunicipioStatusDialog({ municipio, onClose, onSave }: { municipio: MunicipioEdocs; onClose: () => void; onSave: (payload: AlteracaoSituacaoMunicipioEdocsPayload) => Promise<void> }) {
  const [status, setStatus] = useState<SituacaoMunicipioEdocs>(municipio.situacao_atual?.situacao ?? "SEM_DADOS"); const [year, setYear] = useState(""); const [month, setMonth] = useState(""); const [justification, setJustification] = useState(""); const [saving, setSaving] = useState(false);
  const current = municipio.situacao_atual ? municipio.situacao_atual.ano_inicio * 100 + municipio.situacao_atual.mes_inicio : 0; const next = Number(year) * 100 + Number(month); const chronological = next > current;
  return <EdocsModal title="Registrar nova situação" onClose={onClose} wide><div className="mt-4 space-y-4"><p className="text-sm text-slate-600"><strong>{municipio.nome}</strong>. A nova competência deve ser posterior à vigência atual{municipio.situacao_atual ? ` (${municipio.situacao_atual.competencia_inicio})` : ""}.</p><label className="block text-xs font-medium text-slate-600">Nova situação<select className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" value={status} onChange={(event) => setStatus(event.target.value as SituacaoMunicipioEdocs)}>{SITUACOES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><CompetenceFields year={year} month={month} onYear={setYear} onMonth={setMonth} />{year && month && !chronological && <p className="text-xs text-red-700">A competência deve ser posterior à situação vigente.</p>}<JustificationField value={justification} onChange={setJustification} /><DialogActions saving={saving} valid={Number(year) >= 2024 && Number(month) >= 1 && chronological && Boolean(justification.trim())} onClose={onClose} onSubmit={async () => { setSaving(true); try { await onSave({ situacao: status, ano_inicio: Number(year), mes_inicio: Number(month), versao: municipio.versao, justificativa: justification.trim() }); } finally { setSaving(false); } }} /></div></EdocsModal>;
}

function DialogActions({ saving, valid, onClose, onSubmit }: { saving: boolean; valid: boolean; onClose: () => void; onSubmit: () => Promise<void> }) {
  return <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button><Button disabled={!valid || saving} onClick={onSubmit}>{saving ? "Salvando..." : "Salvar"}</Button></div>;
}

function MunicipioHistoryDialog({ municipio, onClose }: { municipio: MunicipioEdocs; onClose: () => void }) {
  return <EdocsModal title={`Vigências — ${municipio.nome}`} onClose={onClose} wide><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-600"><tr><th className="p-3">Situação</th><th className="p-3">Início</th><th className="p-3">Fim</th></tr></thead><tbody>{municipio.vigencias.map((item) => <tr key={item.id} className="border-t"><td className="p-3 font-medium">{situacaoLabel(item.situacao)}</td><td className="p-3">{item.competencia_inicio}</td><td className="p-3">{item.competencia_fim ?? "Vigente"}</td></tr>)}</tbody></table></div></EdocsModal>;
}

function MunicipioAuditDialog({ municipio, onClose }: { municipio: MunicipioEdocs; onClose: () => void }) {
  const key = edocsCacheKeys.auditoriaMunicipios([municipio.id]);
  const { data, error, isLoading, mutate } = useSWR(key, () => listAuditoriaMunicipiosEdocs({ page: 1, page_size: 100, ordering: "-criado_em", municipio_id: municipio.id }), { revalidateOnFocus: false });
  return <EdocsModal title={`Auditoria — ${municipio.nome}`} onClose={onClose} extraWide><div className="mt-4 space-y-3">{isLoading && <p role="status" className="text-sm text-slate-500">Carregando auditoria...</p>}{error && <AdminAlert><div className="flex justify-between gap-3"><span>{getApiErrorMessage(error, "Não foi possível carregar a auditoria.")}</span><Button size="sm" variant="outline" onClick={() => mutate()}>Tentar novamente</Button></div></AdminAlert>}{data?.results.map((event) => <AuditEvent key={event.id} event={event} />)}{data && data.results.length === 0 && <p className="text-sm text-slate-500">Nenhum evento registrado.</p>}</div></EdocsModal>;
}

function AuditEvent({ event }: { event: EventoAuditoriaMunicipioEdocs }) {
  return <details className="rounded-lg border p-3"><summary className="cursor-pointer"><strong>{event.tipo_evento}</strong> <span className="text-sm text-slate-500">— {formatAdminDate(event.criado_em)}</span><span className="block text-sm text-slate-600">{event.mensagem}</span></summary><div className="mt-3 grid gap-3 lg:grid-cols-3"><EdocsJsonBlock title="Anterior" value={event.dados_anteriores} /><EdocsJsonBlock title="Atual" value={event.dados_atuais} /><EdocsJsonBlock title="Metadados" value={event.metadados} /></div><p className="mt-2 text-xs text-slate-500">Responsável: {event.criado_por_nome || "Não informado"}</p></details>;
}
