"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import useSWR, { useSWRConfig } from "swr";
import {
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  Layers3,
  Loader2,
  Network,
  RefreshCw,
  Upload,
} from "lucide-react";

import {
  AdminAlert,
  AdminPage,
  AdminPanel,
} from "@/components/admin/AdminPage";
import { RouteGuard } from "@/components/common/RouteGuard";
import { Button } from "@/components/ui/button";
import {
  addImportacaoConjuntoLotacao,
  getValidationReport,
  getResumoConjuntosOrganograma,
  listConjuntosLotacao,
  listImportacoes,
  processoAtivoKey,
  uploadImportacao,
} from "@/features/carga-org-lot/api";
import type {
  ConjuntoLotacao,
  ImportacaoPlanilha,
  ValidationReport,
} from "@/features/carga-org-lot/model";
import { ValidationReportDialog } from "@/features/carga-org-lot/ValidationReportDialog";
import { LotacoesSectionNav } from "@/features/carga-org-lot/LotacoesSectionNav";
import { usePatriarcaSelection } from "@/features/carga-org-lot/usePatriarcaSelection";
import { formatAdminDate } from "@/lib/adminResource";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { PERMISSIONS } from "@/lib/permissions";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".ods"];

type ImportMode = "NOVO_CONJUNTO" | "ACRESCENTAR_CONJUNTO";

export function NovaImportacaoLotacaoPage() {
  const { mutate } = useSWRConfig();
  const { selected } = usePatriarcaSelection();
  const selectedId = selected?.idpatriarca ?? null;
  const inputRef = useRef<HTMLInputElement>(null);
  const requestedSetRef = useRef<number | null>(null);
  const [organogramaId, setOrganogramaId] = useState<number | null>(null);
  const [reference, setReference] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<ImportMode>("NOVO_CONJUNTO");
  const [targetSetId, setTargetSetId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [created, setCreated] = useState<ImportacaoPlanilha | null>(null);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setOrganogramaId(null);
    setCreated(null);
  }, [selectedId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedOrganogram = Number(params.get("organograma"));
    const requestedSet = Number(params.get("conjunto"));
    if (requestedOrganogram > 0) setOrganogramaId(requestedOrganogram);
    if (requestedSet > 0) {
      requestedSetRef.current = requestedSet;
      setMode("ACRESCENTAR_CONJUNTO");
      setTargetSetId(requestedSet);
    }
  }, [selectedId]);

  const listKey = selectedId
    ? (["carga-org-lot:organogramas-validos-lotacao", selectedId] as const)
    : null;
  const {
    data: organogramas,
    error: organogramasError,
    isLoading: isLoadingOrganogramas,
    mutate: reloadOrganogramas,
  } = useSWR(listKey, () =>
    listImportacoes(selectedId!, 3, { page_size: 100 }),
  );

  const availableOrganogramas =
    organogramas?.results.filter(
      (item) => item.strstatusimportacao !== "REJEITADA",
    ) ?? [];
  const selectedOrganograma = availableOrganogramas.find(
    (item) => item.idimportacaoplanilha === organogramaId,
  );

  const lotationContextKey = selectedId && organogramaId
    ? ([
        "carga-org-lot:conjuntos-organograma",
        selectedId,
        organogramaId,
      ] as const)
    : null;
  const {
    data: lotationContext,
    error: lotationContextError,
    isLoading: isLoadingLotationContext,
  } = useSWR(lotationContextKey, async () => {
    const [summary, sets] = await Promise.all([
      getResumoConjuntosOrganograma(organogramaId!),
      listConjuntosLotacao({ organograma: organogramaId!, page_size: 100 }),
    ]);
    return { summary, sets: sets.results };
  });
  const openSets = lotationContext?.sets.filter((set) =>
    isOpenSet(set.strsituacao),
  ) ?? [];
  const activeSet = lotationContext?.summary.conjunto_ativo ?? null;

  useEffect(() => {
    if (!organogramaId) {
      setMode("NOVO_CONJUNTO");
      setTargetSetId(null);
      return;
    }
    const preferredSet = lotationContext?.sets.find((set) =>
      set.idconjuntolotacao === requestedSetRef.current && isOpenSet(set.strsituacao),
    ) ?? lotationContext?.sets.find((set) => isOpenSet(set.strsituacao));
    if (preferredSet) {
      setMode("ACRESCENTAR_CONJUNTO");
      setTargetSetId(preferredSet.idconjuntolotacao);
    } else if (lotationContext) {
      setMode("NOVO_CONJUNTO");
      setTargetSetId(null);
    }
  }, [lotationContext, organogramaId]);

  const selectedTargetSet = openSets.find(
    (set) => set.idconjuntolotacao === targetSetId,
  );

  function validate(): boolean {
    setFeedback(null);
    if (!selectedId) {
      setFeedback("Selecione um patriarca antes de importar lotações.");
      return false;
    }
    if (!organogramaId) {
      setFeedback("Selecione o organograma que receberá as lotações.");
      return false;
    }
    if (!file) {
      setFeedback("Selecione a planilha de lotações.");
      return false;
    }
    const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setFeedback("Selecione um arquivo XLS, XLSX ou ODS.");
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFeedback("O arquivo deve ter no máximo 20 MB.");
      return false;
    }
    if (mode === "ACRESCENTAR_CONJUNTO" && !targetSetId) {
      setFeedback("Selecione o conjunto que receberá a nova planilha.");
      return false;
    }
    return true;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!validate() || !selectedId || !file || !organogramaId) return;

    setIsSubmitting(true);
    setReport(null);
    try {
      const result =
        mode === "ACRESCENTAR_CONJUNTO" && targetSetId
          ? await addImportacaoConjuntoLotacao(targetSetId, file, reference)
          : await uploadImportacao(selectedId, 4, file, {
              organogramaId,
              referencia: reference,
            });
      setCreated(result);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      await Promise.all([
        mutate(
          (key) =>
            Array.isArray(key) &&
            (key[0] === "carga-org-lot:importacoes" ||
              key[0] === "carga-org-lot:conjuntos-organograma" ||
              key[0] === "carga-org-lot:conjuntos" ||
              key[0] === "carga-org-lot:conjuntos-resumo" ||
              key[0] === "carga-org-lot:conjunto"),
        ),
        mutate(processoAtivoKey(selectedId)),
      ]);
    } catch (caught) {
      const validation = getValidationReport(caught);
      if (validation) setReport(validation);
      setFeedback(
        validation
          ? "A planilha foi registrada, mas sua leitura foi rejeitada. Consulte o relatório."
          : getApiErrorMessage(
              caught,
              "Não foi possível ler e validar a planilha de lotações.",
            ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (created) {
    return (
      <RouteGuard permission={PERMISSIONS.IMPORTACAOPLANILHA_ADD}>
        <AdminPage
          title="Resultado da importação"
          description="A planilha foi preservada e a etapa de leitura e validação foi concluída."
          actions={
            <Button variant="outline" asChild>
              <Link href="/carga-org-lot/lotacoes">
                <ArrowLeft aria-hidden="true" /> Voltar para lotações
              </Link>
            </Button>
          }
        >
          <AdminPanel className="border-emerald-200">
            <div className="p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-app-primary">
                    Validação da planilha
                  </p>
                  <h2 className="text-lg font-semibold text-slate-900">{created.status_importacao_nome}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Importação #{created.idimportacaoplanilha} · {created.strnomearquivo}
                  </p>
                  {created.idconjuntolotacao_id && (
                    <p className="mt-1 text-xs font-medium text-app-primary">
                      Conjunto #{created.idconjuntolotacao_id} ·{" "}
                      {formatOperation(created.strtipooperacaolotacao)}
                    </p>
                  )}
                  <p className="mt-3 max-w-2xl text-sm text-slate-700">
                    {getResultMessage(created.strstatusimportacao)}
                  </p>
                </div>
              </div>
              {created.relatorio_validacao && (
                <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <ResultMetric label="Linhas lidas" value={created.relatorio_validacao.inttotallinhas} />
                  <ResultMetric label="Erros" value={created.relatorio_validacao.inttotalerros} />
                  <ResultMetric label="Avisos" value={created.relatorio_validacao.inttotalavisos} />
                  <ResultMetric label="Normalizações" value={created.relatorio_validacao.inttotalnormalizacoes} />
                </dl>
              )}
              <div className="mt-6 flex justify-end">
                <Button asChild>
                  <Link href="/carga-org-lot/lotacoes">
                    Consultar importações
                  </Link>
                </Button>
              </div>
            </div>
          </AdminPanel>
        </AdminPage>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard permission={PERMISSIONS.IMPORTACAOPLANILHA_ADD}>
      <AdminPage
        title="Nova importação de lotações"
        description="Envie uma planilha de lotações e associe-a a uma versão válida do organograma."
        actions={
          <Button variant="outline" asChild>
            <Link href="/carga-org-lot/lotacoes">
              <ArrowLeft aria-hidden="true" /> Voltar para lotações
            </Link>
          </Button>
        }
      >
        <div className="mb-4"><LotacoesSectionNav /></div>
        <form onSubmit={submit} className="space-y-3">
          {feedback && <AdminAlert>{feedback}</AdminAlert>}

          <AdminPanel>
            <StepSection
              number="1"
              icon={<Network aria-hidden="true" />}
              title="Escolha o organograma"
              description="As lotações ficarão vinculadas exatamente à versão selecionada."
            >
            {organogramasError ? (
              <AdminAlert>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span>Não foi possível carregar os organogramas disponíveis.</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => reloadOrganogramas()}
                  >
                    <RefreshCw aria-hidden="true" /> Tentar novamente
                  </Button>
                </div>
              </AdminAlert>
            ) : (
              <label className="block text-sm font-medium text-slate-700">
                Organograma de referência
                <select
                  value={organogramaId ?? ""}
                  onChange={(event) => {
                    setOrganogramaId(
                      event.target.value ? Number(event.target.value) : null,
                    );
                    setMode("NOVO_CONJUNTO");
                    setTargetSetId(null);
                  }}
                  className={fieldClass}
                  disabled={isLoadingOrganogramas || !availableOrganogramas.length}
                >
                  <option value="">
                    {isLoadingOrganogramas
                      ? "Carregando organogramas..."
                      : "Selecione uma versão válida"}
                  </option>
                  {availableOrganogramas.map((item) => (
                    <option
                      key={item.idimportacaoplanilha}
                      value={item.idimportacaoplanilha}
                    >
                      {formatOrganogramOption(item)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {!isLoadingOrganogramas &&
              !organogramasError &&
              !availableOrganogramas.length && (
                <p className="mt-3 text-sm text-amber-800">
                  Não existe um organograma válido para este patriarca. Importe
                  ou crie um organograma antes de continuar.
                </p>
              )}
            {selectedOrganograma && (
              <OrganogramSummary organograma={selectedOrganograma} />
            )}
            </StepSection>

            <StepSection
              number="2"
              icon={<Layers3 aria-hidden="true" />}
              title="Defina como tratar as lotações"
              description="Essa escolha será aplicada na incorporação, depois da validação."
            >
              {!organogramaId ? (
                <p className="text-sm text-slate-500">
                  Selecione o organograma para verificar os conjuntos de lotação.
                </p>
              ) : isLoadingLotationContext ? (
                <p className="flex items-center gap-2 text-sm text-slate-600">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Verificando conjuntos vinculados ao organograma...
                </p>
              ) : lotationContextError ? (
                <AdminAlert>
                  Não foi possível verificar os conjuntos deste organograma.
                </AdminAlert>
              ) : (
                <LotationSetChoice
                  activeSet={activeSet}
                  openSets={openSets}
                  mode={mode}
                  targetSetId={targetSetId}
                  selectedTargetSet={selectedTargetSet}
                  onModeChange={setMode}
                  onTargetChange={setTargetSetId}
                />
              )}
            </StepSection>

            <StepSection
              number="3"
              icon={<FileSpreadsheet aria-hidden="true" />}
              title="Identifique e envie a planilha"
              description="O arquivo original será preservado para conferência e auditoria."
            >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Referência da importação
                <input
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  placeholder="Ex.: Lotações de outubro de 2026"
                  className={fieldClass}
                />
                <span className="mt-1 block text-xs font-normal text-slate-500">
                  Use um nome que facilite localizar esta carga posteriormente.
                </span>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Planilha de lotações
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls,.ods"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-sm"
                  onChange={(event) =>
                    setFile(event.target.files?.[0] ?? null)
                  }
                />
                <span className="mt-1 block text-xs font-normal text-slate-500">
                  XLS, XLSX ou ODS · máximo de 20 MB
                </span>
              </label>
            </div>
            {file && (
              <div className="mt-4 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <FileSpreadsheet className="text-app-primary" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{file.name}</p>
                  <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
                </div>
              </div>
            )}
            </StepSection>

          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              A planilha será lida e validada em todas as abas não vazias.
            </p>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !organogramaId ||
                !file ||
                isLoadingLotationContext ||
                Boolean(lotationContextError) ||
                (mode === "ACRESCENTAR_CONJUNTO" && !targetSetId)
              }
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Upload aria-hidden="true" />
              )}
              {isSubmitting
                ? "Lendo e validando todas as abas..."
                : "Ler e validar planilha"}
            </Button>
          </div>
          </AdminPanel>
        </form>
      </AdminPage>
      {report && (
        <ValidationReportDialog report={report} onClose={() => setReport(null)} />
      )}
    </RouteGuard>
  );
}

function StepSection({
  number,
  icon,
  title,
  description,
  children,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-slate-200 p-4 last:border-b-0">
      <div>
        <div className="flex items-start gap-3">
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-app-primary [&_svg]:size-4">
            {icon}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-app-primary">
              Etapa {number}
            </p>
            <h2 className="font-semibold text-slate-900">{title}</h2>
            <p className="mt-0.5 text-sm text-slate-600">{description}</p>
          </div>
        </div>
      </div>
      <div className="mt-3 pl-11">{children}</div>
    </section>
  );
}

function LotationSetChoice({
  activeSet,
  openSets,
  mode,
  targetSetId,
  selectedTargetSet,
  onModeChange,
  onTargetChange,
}: {
  activeSet: ConjuntoLotacao | null;
  openSets: ConjuntoLotacao[];
  mode: ImportMode;
  targetSetId: number | null;
  selectedTargetSet?: ConjuntoLotacao;
  onModeChange: (mode: ImportMode) => void;
  onTargetChange: (id: number) => void;
}) {
  return (
    <div className="space-y-3">
      {activeSet && (
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-slate-700">
          <p className="font-medium text-slate-900">
            Conjunto ativo: {formatSetReference(activeSet)}
          </p>
          <p className="mt-0.5 text-xs leading-5">
            {activeSet.total_registros} lotações vigentes · ativado em{" "}
            {activeSet.datativacao
              ? formatAdminDate(activeSet.datativacao)
              : "data não informada"}
          </p>
        </div>
      )}

      {!openSets.length ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p className="font-medium">
            {activeSet
              ? "Nova alternativa para substituir o conjunto ativo"
              : "Primeiro conjunto de lotações"}
          </p>
          <p className="mt-0.5 text-xs leading-5">
            {activeSet
              ? "A versão vigente será preservada durante a validação. Ela só será substituída de forma atômica depois da homologação e ativação da nova alternativa."
              : "Este organograma ainda não possui conjunto ativo ou em preparação. A planilha iniciará o primeiro conjunto."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            <ModeOption
              checked={mode === "ACRESCENTAR_CONJUNTO"}
              title="Continuar conjunto em preparação"
              description={`Adiciona esta planilha a um dos ${openSets.length} conjunto(s) ainda aberto(s), sem alterar o conjunto ativo.`}
              onChange={() => onModeChange("ACRESCENTAR_CONJUNTO")}
            />
            <ModeOption
              checked={mode === "NOVO_CONJUNTO"}
              title={activeSet ? "Criar nova alternativa" : "Criar outro conjunto"}
              description={
                activeSet
                  ? "Inicia outra alternativa que poderá substituir a versão ativa após homologação."
                  : "Inicia um conjunto independente para validação e homologação."
              }
              onChange={() => onModeChange("NOVO_CONJUNTO")}
            />
          </div>
          {mode === "ACRESCENTAR_CONJUNTO" && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <label className="block text-sm font-medium text-slate-700">
                Conjunto em preparação
                <select
                  value={targetSetId ?? ""}
                  onChange={(event) => onTargetChange(Number(event.target.value))}
                  className={fieldClass}
                >
                  {openSets.map((set) => (
                    <option
                      key={set.idconjuntolotacao}
                      value={set.idconjuntolotacao}
                    >
                      {formatSetOption(set)}
                    </option>
                  ))}
                </select>
              </label>
              {selectedTargetSet && (
                <p className="mt-2 text-xs text-slate-600">
                  {selectedTargetSet.total_importacoes} planilha(s) ·{" "}
                  {selectedTargetSet.total_registros} registros ·{" "}
                  {selectedTargetSet.total_casos_pendentes} pendência(s)
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ModeOption({
  checked,
  title,
  description,
  disabled = false,
  note,
  onChange,
}: {
  checked: boolean;
  title: string;
  description: string;
  disabled?: boolean;
  note?: string;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex gap-3 rounded-lg border p-4 transition-colors ${
        disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-500"
          : checked
            ? "cursor-pointer border-sky-500 bg-sky-50"
            : "cursor-pointer border-slate-200 hover:border-sky-300"
      }`}
    >
      <input
        type="radio"
        name="modo-importacao"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="mt-1"
      />
      <span>
        <span className="block font-medium text-slate-900">{title}</span>
        <span className="mt-1 block text-sm leading-5">{description}</span>
        {note && (
          <span className="mt-2 block text-xs font-medium text-amber-700">
            {note}
          </span>
        )}
      </span>
    </label>
  );
}

function OrganogramSummary({
  organograma,
}: {
  organograma: ImportacaoPlanilha;
}) {
  return (
    <dl className="mt-3 grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs sm:grid-cols-4">
      <SummaryItem label="Situação" value={organograma.status_importacao_nome} />
      <SummaryItem
        label="Estrutura"
        value={`${organograma.total_itens_organograma} itens`}
      />
      <SummaryItem
        label="Alterações"
        value={
          organograma.flgpossuialteracoes
            ? "Com alterações manuais"
            : "Sem alterações manuais"
        }
      />
      <SummaryItem
        label="Arquivo de origem"
        value={organograma.strnomearquivo}
      />
    </dl>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="mt-0.5 truncate font-medium text-slate-800" title={value}>
        {value}
      </dd>
    </div>
  );
}

function ResultMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

function formatOrganogramOption(item: ImportacaoPlanilha) {
  const changes = item.flgpossuialteracoes
    ? "com alterações manuais"
    : "sem alterações manuais";
  return `${item.strreferencia || item.strnomearquivo} · ${item.status_importacao_nome} · ${item.total_itens_organograma} itens · ${changes} · ${formatAdminDate(item.datimportacao)}`;
}

function getResultMessage(status: ImportacaoPlanilha["strstatusimportacao"]) {
  if (status === "AGUARDANDO_REVISAO") {
    return "A planilha foi lida e preservada. Revise as pendências antes de incorporar as lotações.";
  }
  if (status === "PRONTA_PARA_INCORPORAR") {
    return "A planilha foi validada e está pronta para a confirmação de incorporação.";
  }
  if (status === "SEM_REGISTROS_VALIDOS") {
    return "A validação terminou sem registros que possam ser incorporados.";
  }
  if (status === "INCORPORADA") {
    return "Os registros foram incorporados ao conjunto. Eles se tornarão vigentes somente depois da homologação e ativação do conjunto.";
  }
  return "O envio não significa que as lotações já foram incorporadas. Consulte a importação para acompanhar as próximas etapas.";
}

function formatOperation(
  operation: ImportacaoPlanilha["strtipooperacaolotacao"],
) {
  if (operation === "INICIAL") return "Importação inicial";
  if (operation === "ACRESCIMO") return "Acréscimo ao conjunto";
  if (operation === "SUBSTITUICAO") return "Alternativa de substituição";
  return "Importação de lotações";
}

function isOpenSet(status: ConjuntoLotacao["strsituacao"]) {
  return !["HOMOLOGADO", "ATIVO", "CANCELADO", "SUBSTITUIDO"].includes(
    status,
  );
}

function formatSetReference(set: ConjuntoLotacao) {
  return set.strreferencia || `Conjunto #${set.idconjuntolotacao}`;
}

function formatSetOption(set: ConjuntoLotacao) {
  return `${formatSetReference(set)} · ${set.situacao_nome} · ${set.total_importacoes} planilha(s)`;
}

const fieldClass =
  "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
