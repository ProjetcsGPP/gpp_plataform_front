"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { AlertTriangle, CheckCircle2, History, Pencil, Sparkles, Trash2, X } from "lucide-react";

import { AdminAlert } from "@/components/admin/AdminPage";
import { Button } from "@/components/ui/button";
import {
  incorporarLotacao,
  listItensLotacaoImportados,
  listItensOrganograma,
  resolveCasoValidacao,
} from "@/features/carga-org-lot/api";
import type {
  CasoValidacaoImportacao,
  CamposCorrecaoLotacao,
  ImportacaoPlanilha,
  ItemLotacaoImportado,
  ItemOrganograma,
  RelatorioValidacaoImportacao,
  ResolverCasoValidacaoPayload,
} from "@/features/carga-org-lot/model";
import { usePermissions } from "@/hooks/usePermissions";
import { formatAdminDate } from "@/lib/adminResource";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { PERMISSIONS } from "@/lib/permissions";

export function LotacaoReviewWorkspace({ importacao, report, onRefresh }: {
  importacao: ImportacaoPlanilha;
  report: RelatorioValidacaoImportacao;
  onRefresh: () => Promise<void>;
}) {
  const { can } = usePermissions();
  const canChange = can(PERMISSIONS.IMPORTACAOPLANILHA_CHANGE);
  const [status, setStatus] = useState(
    report.casos?.some((item) => item.strstatus === "PENDENTE")
      ? "PENDENTE"
      : "",
  );
  const [severity, setSeverity] = useState("");
  const [reviewView, setReviewView] = useState<"CASES" | "ITEMS">("CASES");
  const [selectedCase, setSelectedCase] = useState<CasoValidacaoImportacao | null>(null);
  const [confirmIncorporation, setConfirmIncorporation] = useState(false);
  const [isIncorporating, setIsIncorporating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const { data: items = [], mutate: mutateItems } = useSWR(
    ["carga-org-lot:itens-lotacao-importados", importacao.idimportacaoplanilha],
    () => listItensLotacaoImportados(importacao.idimportacaoplanilha),
    { revalidateOnFocus: false },
  );
  const { data: organogramItems = [] } = useSWR(
    importacao.idimportacaoorganograma_id
      ? ["carga-org-lot:itens-organograma-revisao", importacao.idimportacaoorganograma_id]
      : null,
    () => listItensOrganograma(importacao.idimportacaoorganograma_id!),
    { revalidateOnFocus: false },
  );
  const cases = report.casos ?? [];
  const originalValues = buildOriginalValues(items, cases);
  const filteredCases = cases.filter(
    (item) => (!status || item.strstatus === status) && (!severity || item.strseveridade === severity),
  );
  const pending = cases.filter((item) => item.strstatus === "PENDENTE").length;

  useEffect(() => {
    if (pending === 0 && status === "PENDENTE") setStatus("");
  }, [pending, status]);

  async function refreshAll() {
    await Promise.all([mutateItems(), onRefresh()]);
  }

  async function incorporate() {
    setIsIncorporating(true);
    setFeedback(null);
    try {
      await incorporarLotacao(importacao.idimportacaoplanilha);
      setConfirmIncorporation(false);
      await refreshAll();
    } catch (caught) {
      setFeedback(getApiErrorMessage(caught, "Não foi possível incorporar as lotações."));
    } finally {
      setIsIncorporating(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      {feedback && <AdminAlert variant="error" onClose={() => setFeedback(null)}>{feedback}</AdminAlert>}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex gap-2">
          <Button variant={reviewView === "CASES" ? "default" : "outline"} size="sm" onClick={() => setReviewView("CASES")}>Decisões ({cases.length})</Button>
          <Button variant={reviewView === "ITEMS" ? "default" : "outline"} size="sm" onClick={() => setReviewView("ITEMS")}>Itens tratados ({items.length})</Button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600"><strong>{pending}</strong> casos pendentes</span>
          {importacao.strstatusimportacao === "PRONTA_PARA_INCORPORAR" && canChange && (
            <Button onClick={() => setConfirmIncorporation(true)}><CheckCircle2 /> Incorporar lotações</Button>
          )}
        </div>
      </div>
      {importacao.strstatusimportacao === "PRONTA_PARA_INCORPORAR" && !canChange && (
        <AdminAlert>
          A importação está pronta, mas seu usuário não possui a permissão necessária para incorporar lotações.
        </AdminAlert>
      )}

      {reviewView === "CASES" && <>
      <div className="flex shrink-0 flex-wrap gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <Filter label="Situação" value={status} onChange={setStatus}>
          <option value="">Todas</option><option value="PENDENTE">Pendentes</option><option value="CORRIGIDO">Corrigidos</option><option value="SUGESTAO_APLICADA">Sugestões aplicadas</option><option value="ACEITO_COMO_INFORMADO">Aceitos como informados</option><option value="LINHAS_DESCARTADAS">Linhas descartadas</option>
        </Filter>
        <Filter label="Severidade" value={severity} onChange={setSeverity}>
          <option value="">Todas</option><option value="ERRO">Erros</option><option value="AVISO">Avisos</option>
        </Filter>
      </div>
      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-slate-200 bg-white">
        <div className="divide-y divide-slate-100">
          {filteredCases.map((validationCase) => {
            const caseItems = items.filter((item) => validationCase.item_ids.includes(item.iditemlotacaoimportado));
            return (
              <article key={validationCase.idcasovalidacao} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <CaseSeverity value={validationCase.strseveridade} />
                      <CaseStatus value={validationCase.strstatus} label={validationCase.status_nome} />
                      <span className="font-mono text-xs text-slate-500">{validationCase.strcodigo}</span>
                    </div>
                    <h4 className="mt-2 font-semibold text-slate-900">{validationCase.strtitulo}</h4>
                    <p className="mt-1 text-sm text-slate-600">{validationCase.strmensagem}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {caseItems.length || validationCase.item_ids.length} linha(s): {caseItems.map((item) => `${item.strabaorigem}, linha ${item.intlinhaorigem}`).join("; ") || validationCase.item_ids.map((id) => `#${id}`).join(", ")}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedCase(validationCase)}>
                    {validationCase.strstatus === "PENDENTE" && canChange ? <Pencil /> : <History />}
                    {validationCase.strstatus === "PENDENTE" && canChange ? "Resolver caso" : "Ver decisão"}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
        {!filteredCases.length && <p className="p-10 text-center text-sm text-slate-500">Nenhum caso encontrado para os filtros selecionados.</p>}
      </div>
      </>}
      {reviewView === "ITEMS" && <ImportedItemsTable items={items} originalValues={originalValues} />}

      {selectedCase && (
        <ResolveCaseDialog
          validationCase={selectedCase}
          items={items.filter((item) => selectedCase.item_ids.includes(item.iditemlotacaoimportado))}
          originalValues={originalValues}
          organogramItems={organogramItems}
          canChange={canChange}
          onClose={() => setSelectedCase(null)}
          onResolved={async () => {
            setSelectedCase(null);
            await refreshAll();
          }}
          onConflict={async (message) => {
            setSelectedCase(null);
            setFeedback(`${message} Os dados foram atualizados.`);
            await refreshAll();
          }}
        />
      )}
      {confirmIncorporation && (
        <ConfirmDialog
          isSubmitting={isIncorporating}
          onCancel={() => setConfirmIncorporation(false)}
          onConfirm={incorporate}
        />
      )}
    </div>
  );
}

function ResolveCaseDialog({ validationCase, items, originalValues, organogramItems, canChange, onClose, onResolved, onConflict }: {
  validationCase: CasoValidacaoImportacao;
  items: ItemLotacaoImportado[];
  originalValues: Record<number, Partial<ItemLotacaoImportado>>;
  organogramItems: ItemOrganograma[];
  canChange: boolean;
  onClose: () => void;
  onResolved: () => Promise<void>;
  onConflict: (message: string) => Promise<void>;
}) {
  const editable = validationCase.strstatus === "PENDENTE" && canChange;
  const [mode, setMode] = useState<"MANUAL" | "ACCEPT" | "DISCARD">("MANUAL");
  const [justification, setJustification] = useState("");
  const [discardConfirmed, setDiscardConfirmed] = useState(false);
  const [drafts, setDrafts] = useState<Record<number, ItemLotacaoImportado>>(() => Object.fromEntries(items.map((item) => [item.iditemlotacaoimportado, { ...item }])));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const roots = organogramItems.filter((item) => item.idpai_id === null);
  const rootIds = new Set(roots.map((item) => item.iditemorganograma));
  const organs = organogramItems.filter((item) => item.idpai_id !== null && rootIds.has(item.idpai_id));

  async function submit(payload: ResolverCasoValidacaoPayload) {
    setIsSubmitting(true);
    setError(null);
    try {
      await resolveCasoValidacao(validationCase.idcasovalidacao, payload);
      await onResolved();
    } catch (caught) {
      const message = getApiErrorMessage(caught, "Não foi possível resolver o caso. Revise os dados informados.");
      if (message.toLocaleLowerCase("pt-BR").includes("já foi resolvido")) {
        await onConflict(message);
      } else {
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function submitManual() {
    const hasInvalidCpf = items.some((original) => {
      const draft = drafts[original.iditemlotacaoimportado];
      return cpfWasChanged(original, draft) && !isValidCpf(draft.strcpf);
    });
    if (hasInvalidCpf) {
      setError("Informe um CPF válido com 11 dígitos antes de salvar a correção.");
      return;
    }
    const changes = items.flatMap((original) => {
      const draft = drafts[original.iditemlotacaoimportado];
      const campos = changedFields(original, draft);
      return Object.keys(campos).length ? [{ iditemlotacaoimportado: original.iditemlotacaoimportado, campos }] : [];
    });
    if (!changes.length) {
      setError("Altere ao menos um campo antes de salvar a correção.");
      return;
    }
    void submit({ acao: "CORRIGIR_MANUALMENTE", alteracoes: changes });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="resolve-case-title">
      <section className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div><h2 id="resolve-case-title" className="text-lg font-bold text-slate-900">{validationCase.strtitulo}</h2><p className="mt-1 text-sm text-slate-600">{validationCase.strmensagem}</p></div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar resolução"><X /></Button>
        </header>
        <div className="min-h-0 flex-1 space-y-4 overflow-auto p-5">
          {error && <AdminAlert variant="error" onClose={() => setError(null)}>{error}</AdminAlert>}
          {!editable ? <DecisionHistory validationCase={validationCase} /> : <>
            {validationCase.alternativas.length > 0 && (
              <section><h3 className="text-sm font-semibold text-slate-900">Sugestões do sistema</h3><div className="mt-2 grid gap-2 md:grid-cols-2">{validationCase.alternativas.map((alternative) => <button key={alternative.idalternativaresolucao} type="button" disabled={isSubmitting} onClick={() => void submit({ acao: "APLICAR_SUGESTAO", alternativa_id: alternative.idalternativaresolucao })} className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-left hover:border-sky-400 disabled:opacity-50"><span className="flex items-center gap-2 font-medium text-slate-900"><Sparkles className="size-4 text-sky-700" />{alternative.strdescricao}{alternative.flgrecomendada && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">Recomendada</span>}</span>{alternative.decconfianca !== null && <span className="mt-1 block text-xs text-slate-500">Confiança: {alternative.decconfianca}%</span>}</button>)}</div></section>
            )}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
              <Button type="button" variant={mode === "MANUAL" ? "default" : "outline"} size="sm" onClick={() => setMode("MANUAL")}><Pencil /> Corrigir manualmente</Button>
              {validationCase.strseveridade === "AVISO" && <Button type="button" variant={mode === "ACCEPT" ? "default" : "outline"} size="sm" onClick={() => setMode("ACCEPT")}><CheckCircle2 /> Aceitar como informado</Button>}
              <Button type="button" variant={mode === "DISCARD" ? "default" : "outline"} size="sm" onClick={() => setMode("DISCARD")}><Trash2 /> Descartar linhas</Button>
            </div>
            {mode === "MANUAL" && <ManualCorrection items={items} originalValues={originalValues} drafts={drafts} setDrafts={setDrafts} organs={organs} organogramItems={organogramItems} onSubmit={submitManual} isSubmitting={isSubmitting} />}
            {mode === "ACCEPT" && <JustifiedAction title="Aceitar aviso como informado" description="Use esta opção somente quando os dados estiverem corretos apesar do aviso." value={justification} onChange={setJustification} disabled={isSubmitting} onSubmit={() => void submit({ acao: "ACEITAR_COMO_INFORMADO", justificativa: justification })} submitLabel="Confirmar aceitação" />}
            {mode === "DISCARD" && <section className="space-y-3"><div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900"><AlertTriangle className="mr-2 inline size-4" />As {items.length} linha(s) deste caso não serão incorporadas. Críticas exclusivas dessas linhas também serão encerradas.</div><JustifiedAction title="Justificativa do descarte" description={items.map((item) => `${item.strabaorigem}, linha ${item.intlinhaorigem}`).join("; ")} value={justification} onChange={setJustification} disabled={isSubmitting} hideButton /><label className="flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" checked={discardConfirmed} onChange={(event) => setDiscardConfirmed(event.target.checked)} className="mt-1" />Confirmo que estas linhas devem ser descartadas e não incorporadas.</label><Button variant="destructive" disabled={!discardConfirmed || !justification.trim() || isSubmitting} onClick={() => void submit({ acao: "DESCARTAR_LINHAS", justificativa: justification })}><Trash2 /> Descartar linhas</Button></section>}
          </>}
          {editable && validationCase.resolucoes.length > 0 && <DecisionHistory validationCase={validationCase} />}
        </div>
      </section>
    </div>
  );
}

function ManualCorrection({ items, originalValues, drafts, setDrafts, organs, organogramItems, onSubmit, isSubmitting }: {
  items: ItemLotacaoImportado[];
  originalValues: Record<number, Partial<ItemLotacaoImportado>>;
  drafts: Record<number, ItemLotacaoImportado>;
  setDrafts: React.Dispatch<React.SetStateAction<Record<number, ItemLotacaoImportado>>>;
  organs: ItemOrganograma[];
  organogramItems: ItemOrganograma[];
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  function update(id: number, field: keyof ItemLotacaoImportado, value: string | number | null) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], [field]: value } }));
  }
  const hasInvalidCpf = items.some((item) => {
    const draft = drafts[item.iditemlotacaoimportado];
    return cpfWasChanged(item, draft) && !isValidCpf(draft.strcpf);
  });

  return <section className="space-y-4"><div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-950"><strong>Comparação ativa:</strong> cada campo mantém o valor original da planilha visível ao lado do valor atual ou da correção em edição.</div>{items.map((item) => { const draft = drafts[item.iditemlotacaoimportado]; const source = originalValues[item.iditemlotacaoimportado] ?? item; const organOptions = uniqueOrganogramOptions(organs, draft.idorgaoorganograma_id); const units = uniqueOrganogramOptions(descendantsOf(draft.idorgaoorganograma_id, organogramItems), draft.idunidadeorganograma_id); return <fieldset key={item.iditemlotacaoimportado} className="rounded-lg border border-slate-200 p-4"><legend className="px-2 text-sm font-semibold text-slate-900">{item.strabaorigem}, linha {item.intlinhaorigem}</legend><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"><SelectField label="Órgão do organograma" value={draft.idorgaoorganograma_id} originalValue={source.idorgaoorganograma_id ?? null} options={organOptions} onChange={(value) => { update(item.iditemlotacaoimportado, "idorgaoorganograma_id", value); update(item.iditemlotacaoimportado, "idunidadeorganograma_id", null); }} /><SelectField label="Unidade do organograma" value={draft.idunidadeorganograma_id} originalValue={source.idunidadeorganograma_id ?? null} options={units} onChange={(value) => update(item.iditemlotacaoimportado, "idunidadeorganograma_id", value)} />{manualFields.map(([field, label]) => field === "strcpf" ? <CpfField key={field} value={draft.strcpf} original={String(source.strcpf ?? item.strcpf)} onChange={(value) => update(item.iditemlotacaoimportado, field, value)} /> : <TextField key={field} label={label} value={String(draft[field] ?? "")} original={String(source[field] ?? item[field] ?? "")} onChange={(value) => update(item.iditemlotacaoimportado, field, value)} />)}</div></fieldset>; })}<Button onClick={onSubmit} disabled={isSubmitting || hasInvalidCpf}><CheckCircle2 /> Salvar correção e revalidar</Button></section>;
}

const manualFields: Array<[keyof ItemLotacaoImportado, string]> = [
  ["strnomeservidor", "Nome do servidor"], ["strcpf", "CPF"], ["strcargooriginal", "Cargo informado"], ["strcargonormalizado", "Cargo normalizado"], ["strsiglaorgao", "Sigla do órgão"], ["strnomeorgao", "Nome do órgão"], ["strsiglaunidade", "Sigla da unidade"], ["strnomeunidade", "Nome da unidade"],
];

function changedFields(original: ItemLotacaoImportado, draft: ItemLotacaoImportado): CamposCorrecaoLotacao {
  const fields: Array<keyof CamposCorrecaoLotacao> = ["idorgaoorganograma_id", "idunidadeorganograma_id", "strsiglaorgao", "strnomeorgao", "strnomeservidor", "strcpf", "strcargooriginal", "strcargonormalizado", "strsiglaunidade", "strnomeunidade"];
  return Object.fromEntries(fields.flatMap((field) => {
    const originalValue = field === "strcpf" ? normalizeCpf(original[field]) : original[field];
    const draftValue = field === "strcpf" ? normalizeCpf(draft[field]) : draft[field];
    return originalValue !== draftValue ? [[field, draftValue]] : [];
  })) as CamposCorrecaoLotacao;
}

function normalizeCpf(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

function formatCpf(value: string) {
  return normalizeCpf(value)
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function isValidCpf(value: string) {
  const digits = normalizeCpf(value);
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

  const calculateDigit = (length: number) => {
    const sum = digits
      .slice(0, length)
      .split("")
      .reduce((total, digit, index) => total + Number(digit) * (length + 1 - index), 0);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return calculateDigit(9) === Number(digits[9])
    && calculateDigit(10) === Number(digits[10]);
}

function cpfWasChanged(original: ItemLotacaoImportado, draft: ItemLotacaoImportado) {
  return normalizeCpf(original.strcpf) !== normalizeCpf(draft.strcpf);
}

function descendantsOf(orgId: number | null, items: ItemOrganograma[]) {
  if (!orgId) return [];
  return items.filter((candidate) => { let parent = candidate.idpai_id; if (candidate.iditemorganograma === orgId) return true; const visited = new Set<number>(); while (parent && !visited.has(parent)) { if (parent === orgId) return true; visited.add(parent); parent = items.find((item) => item.iditemorganograma === parent)?.idpai_id ?? null; } return false; });
}

function uniqueOrganogramOptions(
  items: ItemOrganograma[],
  preferredId: number | null,
) {
  const options = new Map<string, ItemOrganograma>();
  for (const item of items) {
    const acronym = normalizeOptionPart(item.strsigla);
    const name = normalizeOptionPart(item.strnome);
    const key = acronym
      ? `sigla:${acronym}`
      : name
        ? `nome:${name}`
        : `id:${item.iditemorganograma}`;
    const current = options.get(key);
    if (!current || item.iditemorganograma === preferredId) {
      options.set(key, item);
    }
  }
  return [...options.values()];
}

function normalizeOptionPart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLocaleUpperCase("pt-BR");
}

function TextField({ label, value, original, onChange }: { label: string; value: string; original: string; onChange: (value: string) => void }) {
  const changed = value !== original;
  return <label className="text-xs font-medium text-slate-600">{label}<span className="mt-1 block rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-normal text-slate-700"><span className="block text-[10px] font-semibold uppercase text-slate-500">Original da planilha</span>{original || "vazio"}</span><span className="mt-1 block text-[10px] font-semibold uppercase text-slate-500">Atual / correção</span><input aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className={`mt-0.5 block w-full rounded-md border px-3 py-2 text-sm ${changed ? "border-amber-400 bg-amber-50" : "border-slate-300"}`} /></label>;
}

function CpfField({ value, original, onChange }: { value: string; original: string; onChange: (value: string) => void }) {
  const changed = normalizeCpf(value) !== normalizeCpf(original);
  const invalid = changed && !isValidCpf(value);
  return <label className="text-xs font-medium text-slate-600">CPF<span className="mt-1 block rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-normal text-slate-700"><span className="block text-[10px] font-semibold uppercase text-slate-500">Original da planilha</span>{formatCpf(original) || "vazio"}</span><span className="mt-1 block text-[10px] font-semibold uppercase text-slate-500">Atual / correção</span><input aria-label="CPF" aria-invalid={invalid} inputMode="numeric" maxLength={14} value={formatCpf(value)} onChange={(event) => onChange(normalizeCpf(event.target.value))} className={`mt-0.5 block w-full rounded-md border px-3 py-2 text-sm ${invalid ? "border-red-400 bg-red-50" : changed ? "border-amber-400 bg-amber-50" : "border-slate-300"}`} />{invalid && <span className="mt-1 block text-[11px] text-red-600">Informe um CPF válido com 11 dígitos.</span>}</label>;
}

function SelectField({ label, value, originalValue, options, onChange }: { label: string; value: number | null; originalValue: number | null; options: ItemOrganograma[]; onChange: (value: number | null) => void }) {
  const original = options.find((item) => item.iditemorganograma === originalValue);
  return <label className="text-xs font-medium text-slate-600">{label}<span className="mt-1 block rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-normal text-slate-700"><span className="block text-[10px] font-semibold uppercase text-slate-500">Original da planilha</span>{original ? `${original.strsigla} — ${original.strnome}` : originalValue ? `Item #${originalValue}` : "Não vinculado"}</span><span className="mt-1 block text-[10px] font-semibold uppercase text-slate-500">Atual / correção</span><select aria-label={label} value={value ?? ""} onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)} className={`mt-0.5 block w-full rounded-md border bg-white px-3 py-2 text-sm ${value !== originalValue ? "border-amber-400 bg-amber-50" : "border-slate-300"}`}><option value="">Não vinculado</option>{options.map((item) => <option key={item.iditemorganograma} value={item.iditemorganograma}>{item.strsigla} — {item.strnome}</option>)}</select></label>;
}

function JustifiedAction({ title, description, value, onChange, disabled, onSubmit, submitLabel, hideButton = false }: { title: string; description: string; value: string; onChange: (value: string) => void; disabled: boolean; onSubmit?: () => void; submitLabel?: string; hideButton?: boolean }) {
  return <section className="space-y-3"><div><h3 className="text-sm font-semibold text-slate-900">{title}</h3><p className="mt-1 text-xs text-slate-500">{description}</p></div><label className="block text-xs font-medium text-slate-600">Justificativa<textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} className="mt-1 block w-full rounded-md border border-slate-300 p-3 text-sm" /></label>{!hideButton && <Button disabled={!value.trim() || disabled} onClick={onSubmit}><CheckCircle2 /> {submitLabel}</Button>}</section>;
}

function DecisionHistory({ validationCase }: { validationCase: CasoValidacaoImportacao }) {
  return <details open={validationCase.strstatus !== "PENDENTE"} className="rounded-lg border border-slate-200 bg-slate-50 p-3"><summary className="cursor-pointer text-sm font-semibold text-slate-900">Histórico da decisão</summary><div className="mt-3 space-y-3">{validationCase.resolucoes.map((resolution) => { const changes = resolutionChanges(resolution.jsonantes, resolution.jsondepois); return <div key={resolution.idresolucaovalidacao} className="rounded-md bg-white p-3 text-sm"><p className="font-medium text-slate-900">{formatAction(resolution.stracao)}</p><p className="text-xs text-slate-500">{formatAdminDate(resolution.datresolucao)} · {resolution.created_by_name || "Usuário não informado"}</p>{resolution.strjustificativa && <p className="mt-2 text-slate-700">{resolution.strjustificativa}</p>}{changes.length > 0 && <div className="mt-3 space-y-2"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Valores alterados</p>{changes.map((change) => <div key={`${change.itemId}-${change.field}`} className="grid gap-1 rounded-md border border-slate-200 p-2 text-xs sm:grid-cols-[10rem_1fr]"><span className="font-medium text-slate-700">Item #{change.itemId} · {correctionFieldLabel(change.field)}</span><span><span className="text-red-700 line-through">{formatCorrectionValue(change.field, change.before)}</span><span className="mx-2 text-slate-400">→</span><span className="font-medium text-emerald-800">{formatCorrectionValue(change.field, change.after)}</span></span></div>)}</div>}</div>; })}{!validationCase.resolucoes.length && <p className="text-sm text-slate-500">Nenhuma decisão registrada.</p>}</div></details>;
}

function ImportedItemsTable({ items, originalValues }: { items: ItemLotacaoImportado[]; originalValues: Record<number, Partial<ItemLotacaoImportado>> }) {
  return <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-slate-200 bg-white"><table className="w-full min-w-[76rem] text-left text-sm"><thead className="sticky top-0 z-10 bg-slate-100 text-xs uppercase text-slate-600"><tr><th className="px-3 py-2">Origem</th><th className="px-3 py-2">Servidor / CPF</th><th className="px-3 py-2">Órgão</th><th className="px-3 py-2">Unidade</th><th className="px-3 py-2">Cargo</th><th className="px-3 py-2">Situação</th></tr></thead><tbody className="divide-y divide-slate-100">{items.map((item) => { const original = originalValues[item.iditemlotacaoimportado] ?? item; return <tr key={item.iditemlotacaoimportado} className="align-top"><td className="px-3 py-2">{item.strabaorigem}, linha {item.intlinhaorigem}</td><td className="space-y-2 px-3 py-2"><ComparisonValue label="Servidor" original={original.strnomeservidor} current={item.strnomeservidor} /><ComparisonValue label="CPF" original={formatCpf(String(original.strcpf ?? ""))} current={formatCpf(item.strcpf)} /></td><td className="px-3 py-2"><ComparisonValue original={joinValues(original.strsiglaorgao, original.strnomeorgao)} current={joinValues(item.strsiglaorgao, item.strnomeorgao)} /></td><td className="px-3 py-2"><ComparisonValue original={joinValues(original.strsiglaunidade, original.strnomeunidade)} current={joinValues(item.strsiglaunidade, item.strnomeunidade)} /></td><td className="px-3 py-2"><ComparisonValue original={joinValues(original.strcargooriginal, original.strcargonormalizado)} current={joinValues(item.strcargooriginal, item.strcargonormalizado)} /></td><td className="px-3 py-2"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.strsituacao === "DESCARTADO" ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>{item.situacao_nome}</span></td></tr>; })}</tbody></table>{!items.length && <p className="p-10 text-center text-sm text-slate-500">Nenhum item importado foi encontrado.</p>}</div>;
}

function ComparisonValue({ label, original, current }: { label?: string; original: unknown; current: unknown }) {
  const originalText = String(original ?? "").trim() || "vazio";
  const currentText = String(current ?? "").trim() || "vazio";
  const changed = originalText !== currentText;
  return <div className="min-w-40"><span className="block text-[10px] font-semibold uppercase text-slate-500">{label ? `${label} · original` : "Original"}</span><span className="block text-xs text-slate-600">{originalText}</span><span className="mt-1 block text-[10px] font-semibold uppercase text-slate-500">Atual / corrigido</span><span className={`block text-xs font-medium ${changed ? "text-emerald-800" : "text-slate-700"}`}>{currentText}{changed && <span className="ml-1 text-[10px] font-semibold uppercase">alterado</span>}</span></div>;
}

function joinValues(first: unknown, second: unknown) {
  return [first, second].map((value) => String(value ?? "").trim()).filter(Boolean).join(" — ");
}

function buildOriginalValues(items: ItemLotacaoImportado[], cases: CasoValidacaoImportacao[]) {
  const values: Record<number, Partial<ItemLotacaoImportado>> = Object.fromEntries(
    items.map((item) => [item.iditemlotacaoimportado, { ...item }]),
  );
  const captured = new Set<number>();
  const resolutions = cases
    .flatMap((validationCase) => validationCase.resolucoes)
    .sort((a, b) => a.datresolucao.localeCompare(b.datresolucao));
  for (const resolution of resolutions) {
    if (!Array.isArray(resolution.jsonantes)) continue;
    for (const snapshot of resolution.jsonantes) {
      if (!isSnapshot(snapshot)) continue;
      const id = Number(snapshot.iditemlotacaoimportado);
      if (!id || captured.has(id)) continue;
      values[id] = { ...values[id], ...snapshot } as Partial<ItemLotacaoImportado>;
      captured.add(id);
    }
  }
  for (const item of items) {
    const original = values[item.iditemlotacaoimportado] ?? {};
    values[item.iditemlotacaoimportado] = {
      ...original,
      strcpf: item.strcpforiginal || original.strcpf,
      strsiglaorgao: item.strsiglaorgaooriginal || original.strsiglaorgao,
      strsiglaunidade: item.strsiglaunidadeoriginal || original.strsiglaunidade,
    };
  }
  return values;
}

function resolutionChanges(beforeValue: unknown, afterValue: unknown) {
  const before = Array.isArray(beforeValue) ? beforeValue : [];
  const after = Array.isArray(afterValue) ? afterValue : [];
  const beforeById = new Map(
    before
      .filter(isSnapshot)
      .map((item) => [Number(item.iditemlotacaoimportado), item]),
  );
  return after.filter(isSnapshot).flatMap((current) => {
    const itemId = Number(current.iditemlotacaoimportado);
    const previous = beforeById.get(itemId) ?? {};
    return Object.keys(current).flatMap((field) => {
      if (field === "iditemlotacaoimportado") return [];
      const beforeField = previous[field];
      const afterField = current[field];
      return JSON.stringify(beforeField) !== JSON.stringify(afterField)
        ? [{ itemId, field, before: beforeField, after: afterField }]
        : [];
    });
  });
}

function isSnapshot(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function correctionFieldLabel(field: string) {
  return ({
    idorgaoorganograma_id: "Órgão",
    idunidadeorganograma_id: "Unidade",
    strsiglaorgao: "Sigla do órgão",
    strnomeorgao: "Nome do órgão",
    strnomeservidor: "Nome do servidor",
    strcpf: "CPF",
    strcargooriginal: "Cargo informado",
    strcargonormalizado: "Cargo normalizado",
    strsiglaunidade: "Sigla da unidade",
    strnomeunidade: "Nome da unidade",
    strsituacao: "Situação",
  } as Record<string, string>)[field] ?? field;
}

function formatCorrectionValue(field: string, value: unknown) {
  if (value === null || value === undefined || value === "") return "vazio";
  if (field === "strcpf") return formatCpf(String(value));
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

function ConfirmDialog({ isSubmitting, onCancel, onConfirm }: { isSubmitting: boolean; onCancel: () => void; onConfirm: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="incorporate-title"><section className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl"><h2 id="incorporate-title" className="text-lg font-bold text-slate-900">Incorporar lotações</h2><p className="mt-2 text-sm text-slate-600">As linhas aceitas serão gravadas como lotações definitivas vinculadas ao organograma selecionado. Essa importação ficará preservada no histórico.</p><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button><Button onClick={onConfirm} disabled={isSubmitting}><CheckCircle2 /> Confirmar incorporação</Button></div></section></div>;
}

function Filter({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label className="text-xs font-medium text-slate-600">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 block min-w-44 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">{children}</select></label>;
}

function CaseSeverity({ value }: { value: "ERRO" | "AVISO" }) { return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${value === "ERRO" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-900"}`}>{value === "ERRO" ? "Erro" : "Aviso"}</span>; }
function CaseStatus({ value, label }: { value: string; label: string }) { return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${value === "PENDENTE" ? "bg-orange-100 text-orange-900" : "bg-emerald-100 text-emerald-800"}`}>{label}</span>; }
function formatAction(value: string) { return ({ CORRIGIR_MANUALMENTE: "Correção manual", APLICAR_SUGESTAO: "Sugestão aplicada", ACEITAR_COMO_INFORMADO: "Aceito como informado", DESCARTAR_LINHAS: "Linhas descartadas" } as Record<string, string>)[value] ?? value; }
