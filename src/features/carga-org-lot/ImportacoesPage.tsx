"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import useSWR, { useSWRConfig } from "swr";
import {
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  Info,
  Loader2,
  Network,
  Send,
  Trash2,
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
  createInitialOrganograma,
  deleteImportacao,
  downloadArquivo,
  getSheetSelectionReport,
  getValidationReport,
  latestOrganogramaUrl,
  listImportacoes,
  processoAtivoKey,
  uploadImportacao,
} from "@/features/carga-org-lot/api";
import { DeleteImportacaoDialog } from "@/features/carga-org-lot/DeleteImportacaoDialog";
import { ImportacaoDetailsDialog } from "@/features/carga-org-lot/ImportacaoDetailsDialog";
import type {
  ImportacaoPlanilha,
  PaginatedResponse,
  SheetSelectionReport,
  ValidationReport,
} from "@/features/carga-org-lot/model";
import { OrganogramaTreePanel } from "@/features/carga-org-lot/OrganogramaTreeDialog";
import { RelatorioValidacaoPanel } from "@/features/carga-org-lot/RelatorioValidacaoPanel";
import { SheetSelectionDialog } from "@/features/carga-org-lot/SheetSelectionDialog";
import { ValidationReportDialog } from "@/features/carga-org-lot/ValidationReportDialog";
import { usePatriarcaSelection } from "@/features/carga-org-lot/usePatriarcaSelection";
import { usePermissions } from "@/hooks/usePermissions";
import { formatAdminDate } from "@/lib/adminResource";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { PERMISSIONS } from "@/lib/permissions";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".ods"];

export function ImportacoesPage({ tipoCarga }: { tipoCarga: 3 | 4 }) {
  const { mutate: mutateCache } = useSWRConfig();
  const isOrganograma = tipoCarga === 3;
  const { can } = usePermissions();
  const { selected } = usePatriarcaSelection();
  const selectedId = selected?.idpatriarca ?? null;
  const [file, setFile] = useState<File | null>(null);
  const [reference, setReference] = useState("");
  const [initialReference, setInitialReference] = useState(
    "Estrutura inicial padrão",
  );
  const [isCreatingInitial, setIsCreatingInitial] = useState(false);
  const [criarUnidadesEspelho, setCriarUnidadesEspelho] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [organogramFilter, setOrganogramFilter] = useState("");
  const [ordering, setOrdering] = useState("-datimportacao");
  const [progress, setProgress] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{
    kind: "error" | "success";
    message: string;
  } | null>(null);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [sheetSelection, setSheetSelection] =
    useState<SheetSelectionReport | null>(null);
  const [viewingImportacao, setViewingImportacao] =
    useState<ImportacaoPlanilha | null>(null);
  const [viewingReport, setViewingReport] = useState<ImportacaoPlanilha | null>(
    null,
  );
  const [viewingDetails, setViewingDetails] =
    useState<ImportacaoPlanilha | null>(null);
  const [deletingImportacao, setDeletingImportacao] =
    useState<ImportacaoPlanilha | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 5_000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    setOrganogramFilter("");
  }, [selectedId]);

  useEffect(() => {
    setViewingImportacao(null);
    setViewingReport(null);
    setViewingDetails(null);
    setDeletingImportacao(null);
    setReport(null);
    setSheetSelection(null);
    setFile(null);
    setReference("");
    setStatusFilter("");
    setFeedback(null);
    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [tipoCarga]);

  const { data: organogramData } = useSWR(
    selectedId && !isOrganograma
      ? (["carga-org-lot:organogramas-para-lotacoes", selectedId] as const)
      : null,
    () => listAllOrganograms(selectedId!),
  );
  const organogramById = useMemo(
    () =>
      new Map(
        (organogramData?.results ?? []).map((item) => [
          item.idimportacaoplanilha,
          item,
        ]),
      ),
    [organogramData],
  );

  const listKey = selectedId
    ? ([
        "carga-org-lot:importacoes",
        selectedId,
        isOrganograma ? "organograma" : "lotacoes",
        statusFilter,
        organogramFilter,
        ordering,
      ] as const)
    : null;
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    listKey,
    async () => {
      const params = {
        ordering,
        ...(statusFilter ? { status_importacao: statusFilter } : {}),
        ...(!isOrganograma && organogramFilter
          ? { organograma: Number(organogramFilter) }
          : {}),
      };
      if (isOrganograma) return listImportacoes(selectedId!, 3, params);
      const [single, packageImports] = await Promise.all([
        listImportacoes(selectedId!, 4, params),
        listImportacoes(selectedId!, 5, params),
      ]);
      return combineImports(single, packageImports, ordering);
    },
  );
  function validateFile(): boolean {
    setFeedback(null);
    if (!selectedId || !file) {
      setFeedback({
        kind: "error",
        message: "Selecione um arquivo para o patriarca ativo.",
      });
      return false;
    }
    const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setFeedback({
        kind: "error",
        message: "Selecione um arquivo .xlsx, .xls ou .ods.",
      });
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFeedback({
        kind: "error",
        message: "O arquivo deve ter no máximo 20 MB.",
      });
      return false;
    }
    return true;
  }

  async function performUpload(aba?: string) {
    if (!selectedId || !file) return;
    setFeedback(null);
    setReport(null);
    setProgress(0);
    try {
      await uploadImportacao(
        selectedId,
        3,
        file,
        {
          aba,
          referencia: reference,
          criarUnidadesEspelho,
          onUploadProgress: ({ loaded, total }) =>
            setProgress(total ? Math.round((loaded * 100) / total) : 0),
        },
      );
      await Promise.all([mutate(), mutateCache(processoAtivoKey(selectedId))]);
      setFile(null);
      setReference("");
      setCriarUnidadesEspelho(false);
      setSheetSelection(null);
      if (inputRef.current) inputRef.current.value = "";
      setFeedback({
        kind: "success",
        message: "Organograma importado com sucesso.",
      });
    } catch (caught) {
      const selection = getSheetSelectionReport(caught);
      const validation = getValidationReport(caught);
      if (selection) {
        setSheetSelection(selection);
        setFeedback(null);
      } else {
        setSheetSelection(null);
        if (validation) {
          await Promise.all([
            mutate(),
            mutateCache(processoAtivoKey(selectedId)),
          ]);
          setReport(validation);
          setFeedback({
            kind: "error",
            message: `A importação${validation.idimportacaoplanilha ? ` #${validation.idimportacaoplanilha}` : ""} foi registrada como rejeitada.`,
          });
        } else {
          setFeedback({
            kind: "error",
            message: getApiErrorMessage(
              caught,
              "Não foi possível enviar o arquivo.",
            ),
          });
        }
      }
    } finally {
      setProgress(null);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (validateFile()) await performUpload();
  }

  async function createFromScratch() {
    if (!selectedId) return;
    setIsCreatingInitial(true);
    setFeedback(null);
    try {
      const created = await createInitialOrganograma(
        selectedId,
        initialReference,
      );
      await Promise.all([mutate(), mutateCache(processoAtivoKey(selectedId))]);
      setFeedback({
        kind: "success",
        message: "Organograma inicial criado com sucesso.",
      });
      setViewingImportacao(created);
    } catch (caught) {
      setFeedback({
        kind: "error",
        message: getApiErrorMessage(
          caught,
          "Não foi possível criar o organograma inicial.",
        ),
      });
    } finally {
      setIsCreatingInitial(false);
    }
  }

  async function download(url: string, name: string) {
    setFeedback(null);
    try {
      await downloadArquivo(url, name);
    } catch (caught) {
      setFeedback({
        kind: "error",
        message: getApiErrorMessage(
          caught,
          "Não foi possível baixar o arquivo.",
        ),
      });
    }
  }

  async function confirmDelete() {
    if (!deletingImportacao) return;
    setIsDeleting(true);
    setFeedback(null);
    try {
      await deleteImportacao(deletingImportacao.idimportacaoplanilha);
      setDeletingImportacao(null);
      setViewingImportacao(null);
      setViewingReport(null);
      await mutate();
      setFeedback({
        kind: "success",
        message: "Versão importada excluída definitivamente.",
      });
    } catch (caught) {
      setDeletingImportacao(null);
      setFeedback({
        kind: "error",
        message: getApiErrorMessage(
          caught,
          "Não foi possível excluir a versão importada.",
        ),
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <RouteGuard permission={PERMISSIONS.IMPORTACAOPLANILHA_VIEW}>
      <AdminPage
        title={isOrganograma ? "Organogramas" : "Lotações"}
        description={
          isOrganograma
            ? "Crie, envie e consulte versões do organograma de cada patriarca."
            : "Importe lotações vinculadas à versão exata do organograma utilizada."
        }
        actions={
          isOrganograma ? (
            <Button variant="outline" asChild>
              <Link href="/carga-org-lot/organogramas/envio-prodest">
                <Send aria-hidden="true" /> Envio para a PRODEST
              </Link>
            </Button>
          ) : can(PERMISSIONS.IMPORTACAOPLANILHA_ADD) ? (
            <Button asChild>
              <Link href="/carga-org-lot/lotacoes/importar">
                <Upload aria-hidden="true" /> Nova importação
              </Link>
            </Button>
          ) : undefined
        }
      >
        {viewingReport ? (
          <RelatorioValidacaoPanel
            key={viewingReport.idimportacaoplanilha}
            importacao={viewingReport}
            organograma={
              viewingReport.idimportacaoorganograma_id
                ? organogramById.get(viewingReport.idimportacaoorganograma_id) ?? null
                : null
            }
            onClose={() => setViewingReport(null)}
            onRefresh={() => mutate()}
          />
        ) : viewingImportacao ? (
          <OrganogramaTreePanel
            importacao={viewingImportacao}
            onClose={() => setViewingImportacao(null)}
          />
        ) : (
          <div className="space-y-5">
            {feedback && (
              <AdminAlert
                variant={feedback.kind}
                onClose={() => setFeedback(null)}
              >
                {feedback.message}
              </AdminAlert>
            )}
            {selected &&
              isOrganograma &&
              can(PERMISSIONS.IMPORTACAOPLANILHA_ADD) && (
              <div
                className={
                  isOrganograma
                    ? "grid gap-5 lg:grid-cols-2 lg:items-stretch"
                    : undefined
                }
              >
                {isOrganograma && (
                  <AdminPanel className="h-full border-sky-200">
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-app-primary">
                          <Network aria-hidden="true" />
                        </span>
                        <div>
                          <h2 className="font-semibold text-slate-900">
                            Criar organograma do zero
                          </h2>
                          <p className="mt-1 text-sm text-slate-600">
                            Crie uma estrutura inicial válida para o patriarca
                            selecionado, pronta para visualizar, editar e baixar
                            em XLSX.
                          </p>
                        </div>
                      </div>

                      <div
                        className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
                        role="note"
                      >
                        <p className="font-medium">
                          Estrutura criada como exemplo
                        </p>
                        <p className="mt-1 text-xs leading-5">
                          Serão criados o Gabinete do Prefeito e as Secretarias
                          Municipais da Fazenda, de Saúde e de Educação. Cada
                          órgão também terá uma unidade com o mesmo nome e
                          sigla. Você poderá alterar os nomes e as siglas a
                          qualquer momento.
                        </p>
                      </div>

                      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                        <label className="flex-1 text-sm text-slate-700">
                          Referência{" "}
                          <span className="text-xs text-slate-500">
                            (opcional)
                          </span>
                          <input
                            value={initialReference}
                            onChange={(event) =>
                              setInitialReference(event.target.value)
                            }
                            placeholder="Ex.: Estrutura inicial padrão"
                            className={selectClass}
                          />
                        </label>
                        <Button
                          type="button"
                          onClick={createFromScratch}
                          disabled={isCreatingInitial}
                        >
                          {isCreatingInitial ? (
                            <Loader2
                              className="animate-spin"
                              aria-hidden="true"
                            />
                          ) : (
                            <Network aria-hidden="true" />
                          )}
                          {isCreatingInitial
                            ? "Criando organograma..."
                            : "Criar organograma inicial"}
                        </Button>
                      </div>
                    </div>
                  </AdminPanel>
                )}
                <AdminPanel className="h-full">
                  <form onSubmit={submit} className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-app-primary">
                        <Upload aria-hidden="true" />
                      </span>
                      <div>
                        <h2 className="font-semibold text-slate-900">
                          Enviar organograma
                        </h2>
                        <p className="mt-1 text-sm text-slate-600">
                          Envie uma estrutura existente para validar, visualizar
                          e editar no sistema.
                        </p>
                      </div>
                    </div>
                    <div
                      className="mt-4 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-slate-700"
                      role="note"
                    >
                      <p className="font-medium text-slate-900">
                        Importação de planilha existente
                      </p>
                      <p className="mt-1 text-xs leading-5">
                        Selecione um arquivo de organograma em formato XLSX, XLS
                        ou ODS, com no máximo 20 MB.
                      </p>
                    </div>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                      <label className="min-w-0 flex-1 text-sm text-slate-700">
                        Referência{" "}
                        <span className="text-xs text-slate-500">
                          (opcional)
                        </span>
                        <input
                          value={reference}
                          onChange={(event) => setReference(event.target.value)}
                          placeholder="Ex.: Estrutura 2026"
                          className={selectClass}
                        />
                      </label>
                      <label className="min-w-0 flex-1 text-sm text-slate-700">
                        Arquivo
                        <input
                          ref={inputRef}
                          type="file"
                          accept=".xlsx,.xls,.ods"
                          className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-sm"
                          onChange={(event) =>
                            setFile(event.target.files?.[0] ?? null)
                          }
                        />
                      </label>
                    </div>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <label className="flex flex-1 items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            aria-label="Criar automaticamente uma unidade para cada órgão"
                            checked={criarUnidadesEspelho}
                            onChange={(event) =>
                              setCriarUnidadesEspelho(event.target.checked)
                            }
                            className="mt-0.5 size-4 shrink-0"
                          />
                          <span>
                            <span className="block font-medium text-slate-900">
                              Criar automaticamente uma unidade para cada órgão
                            </span>
                            <span className="mt-0.5 block text-xs text-slate-600">
                              Quando marcado, o sistema criará, para cada órgão
                              (segundo nível do organograma), que ainda não
                              possua, uma unidade direta com o mesmo nome e
                              sigla. Essa unidade é criada desta forma para a
                              criação da caixa de processos e encaminhamentos do
                              E-Docs.
                            </span>
                          </span>
                        </label>
                        <Button
                          type="submit"
                          disabled={!file || progress !== null}
                        >
                          {progress !== null ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            <Upload />
                          )}
                          {progress !== null
                            ? `Enviando ${progress}%`
                            : "Enviar arquivo"}
                        </Button>
                    </div>
                    {file && (
                      <p className="mt-1 text-xs text-slate-500">
                        Selecionado: {file.name} ({formatBytes(file.size)}) ·{" "}
                        Organograma
                      </p>
                    )}
                    {progress !== null && (
                      <div
                        className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"
                        role="progressbar"
                        aria-valuenow={progress}
                      >
                        <div
                          className="h-full bg-app-primary transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </form>
                </AdminPanel>
              </div>
            )}
            {selected && (
              <AdminPanel>
                <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
                  <h2 className="font-semibold text-slate-900">
                    Arquivos armazenados
                  </h2>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    {!isOrganograma && (
                      <label className="text-sm text-slate-700">
                        Organograma
                        <select
                          value={organogramFilter}
                          onChange={(event) =>
                            setOrganogramFilter(event.target.value)
                          }
                          className={`${selectClass} min-w-56`}
                        >
                          <option value="">Todos</option>
                          {organogramData?.results.map((item) => (
                            <option
                              key={item.idimportacaoplanilha}
                              value={item.idimportacaoplanilha}
                            >
                              {formatOrganogramLabel(item)}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    <label className="text-sm text-slate-700">
                      Status da importação
                      <select
                        value={statusFilter}
                        onChange={(event) =>
                          setStatusFilter(event.target.value)
                        }
                        className={`${selectClass} min-w-52`}
                      >
                        <option value="">Todos</option>
                        {!isOrganograma && (
                          <>
                            <option value="AGUARDANDO_REVISAO">
                              Aguardando revisão
                            </option>
                            <option value="PRONTA_PARA_INCORPORAR">
                              Pronta para incorporar
                            </option>
                            <option value="INCORPORANDO">Incorporando</option>
                            <option value="SEM_REGISTROS_VALIDOS">
                              Sem registros válidos
                            </option>
                          </>
                        )}
                        {isOrganograma && (
                          <>
                            <option value="RECEBIDA">Recebida</option>
                            <option value="PROCESSANDO">Processando</option>
                            <option value="VALIDADA">Validada</option>
                          </>
                        )}
                        <option value="INCORPORADA">Incorporada</option>
                        {isOrganograma && (
                          <>
                            <option value="ALTERADA">Alterada</option>
                            <option value="SUBSTITUIDA">Substituída</option>
                          </>
                        )}
                        <option value="REJEITADA">Rejeitada</option>
                        <option value="ERRO_PROCESSAMENTO">
                          Erro de processamento
                        </option>
                      </select>
                    </label>
                    <label className="text-sm text-slate-700">
                      Ordenar por
                      <select
                        value={ordering}
                        onChange={(event) => setOrdering(event.target.value)}
                        className={`${selectClass} min-w-48`}
                      >
                        <option value="-datimportacao">Mais recentes</option>
                        <option value="datimportacao">Mais antigas</option>
                        <option value="strnomearquivo">Arquivo (A–Z)</option>
                        <option value="-strnomearquivo">Arquivo (Z–A)</option>
                        <option value="-inttamanhoarquivo">Maior arquivo</option>
                        <option value="inttamanhoarquivo">Menor arquivo</option>
                      </select>
                    </label>
                    {isOrganograma &&
                      Boolean(
                        data?.results.some(
                          (item) => item.strstatusimportacao !== "REJEITADA",
                        ),
                      ) && (
                        <Button
                          variant="outline"
                          onClick={() =>
                            download(
                              latestOrganogramaUrl(selected.idpatriarca),
                              `organograma-${selected.strsiglapatriarca}.xlsx`,
                            )
                          }
                        >
                          <Download /> Baixar versão mais recente
                        </Button>
                      )}
                  </div>
                </div>
                {error ? (
                  <div className="p-5">
                    <AdminAlert>
                      <div className="flex justify-between gap-3">
                        <span>
                          {getApiErrorMessage(
                            error,
                            "Não foi possível carregar os arquivos.",
                          )}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => mutate()}
                        >
                          Tentar novamente
                        </Button>
                      </div>
                    </AdminAlert>
                  </div>
                ) : isLoading ? (
                  <div className="p-8 text-center text-sm text-slate-500">
                    Carregando arquivos...
                  </div>
                ) : (
                  <div className="overflow-x-auto" aria-busy={isValidating}>
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                        <tr>
                          {!isOrganograma && (
                            <th className="px-5 py-3">Organograma</th>
                          )}
                          <th className="px-5 py-3">Referência / arquivo</th>
                          {isOrganograma && (
                            <th className="px-5 py-3">Tipo / aba</th>
                          )}
                          <th className="px-5 py-3">Data / responsável</th>
                          <th className="px-5 py-3">Status</th>
                          <th className="px-5 py-3">Validação</th>
                          <th className="px-5 py-3 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data?.results.map((item) => (
                          <tr key={item.idimportacaoplanilha}>
                            {!isOrganograma && (
                              <td className="px-5 py-3">
                                <OrganogramCell
                                  id={item.idimportacaoorganograma_id}
                                  organograma={
                                    item.idimportacaoorganograma_id
                                      ? organogramById.get(
                                          item.idimportacaoorganograma_id,
                                        ) ?? null
                                      : null
                                  }
                                />
                              </td>
                            )}
                            <td className="px-5 py-3 font-medium">
                              {item.strreferencia || "Sem referência"}
                              <span className="block text-xs font-normal text-slate-500">
                                {item.strnomearquivo} ·{" "}
                                {formatBytes(item.inttamanhoarquivo)}
                                {isOrganograma
                                  ? ` · ${item.total_itens_organograma} itens`
                                  : ""}
                              </span>
                            </td>
                            {isOrganograma && (
                              <td className="px-5 py-3">
                                {item.tipo_carga.strdescricao}
                                <span className="block text-xs text-slate-500">
                                  {item.strabaimportada || "Sem aba"}
                                </span>
                              </td>
                            )}
                            <td className="px-5 py-3">
                              {formatAdminDate(item.datimportacao)}
                              <span className="block text-xs text-slate-500">
                                {item.created_by_name || "—"}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <ImportStatusBadge
                                status={item.strstatusimportacao}
                                label={item.status_importacao_nome}
                              />
                            </td>
                            <td className="px-5 py-3">
                              <ValidationResult item={item} />
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex justify-end gap-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="table-action-button"
                                  onClick={() => setViewingDetails(item)}
                                >
                                  <Info /> Detalhes
                                </Button>
                                {item.relatorio_validacao && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="table-action-button"
                                    onClick={() => setViewingReport(item)}
                                  >
                                    <ClipboardList /> Relatório
                                  </Button>
                                )}
                                {!isOrganograma &&
                                  item.strstatusimportacao === "PRONTA_PARA_INCORPORAR" &&
                                  can(PERMISSIONS.IMPORTACAOPLANILHA_CHANGE) && (
                                    <Button
                                      size="sm"
                                      className="table-action-button"
                                      onClick={() => setViewingReport(item)}
                                    >
                                      <CheckCircle2 /> Incorporar
                                    </Button>
                                  )}
                                {isOrganograma &&
                                  item.strstatusimportacao !== "REJEITADA" &&
                                  item.total_itens_organograma > 0 &&
                                  can(PERMISSIONS.ITEMORGANOGRAMA_VIEW) && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="table-action-button"
                                      onClick={() => setViewingImportacao(item)}
                                    >
                                      <Eye /> Visualizar organograma
                                    </Button>
                                  )}
                                {can(PERMISSIONS.IMPORTACAOPLANILHA_VIEW) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="table-action-button"
                                    onClick={() =>
                                      download(
                                        item.download_url,
                                        item.strnomearquivo,
                                      )
                                    }
                                  >
                                    <Download /> Planilha original
                                  </Button>
                                )}
                                {isOrganograma &&
                                  can(PERMISSIONS.IMPORTACAOPLANILHA_VIEW) &&
                                  item.flgpossuialteracoes &&
                                  item.organograma_atualizado_download_url && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="table-action-button"
                                      onClick={() =>
                                        download(
                                          item.organograma_atualizado_download_url!,
                                          `organograma-atualizado-${item.patriarca.strsiglapatriarca}.xlsx`,
                                        )
                                      }
                                    >
                                      <Download /> Organograma atualizado
                                    </Button>
                                  )}
                                {can(PERMISSIONS.IMPORTACAOPLANILHA_DELETE) &&
                                  !item.idconjuntolotacao_id && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="table-action-button text-red-700"
                                    onClick={() => setDeletingImportacao(item)}
                                  >
                                    <Trash2 /> Excluir
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!data?.results.length && (
                      <div className="p-10 text-center text-sm text-slate-500">
                        Nenhum arquivo enviado para este patriarca.
                      </div>
                    )}
                  </div>
                )}
              </AdminPanel>
            )}
          </div>
        )}
      </AdminPage>
      {report && (
        <ValidationReportDialog
          report={report}
          onClose={() => setReport(null)}
        />
      )}
      {sheetSelection && (
        <SheetSelectionDialog
          report={sheetSelection}
          isSubmitting={progress !== null}
          onCancel={() => setSheetSelection(null)}
          onConfirm={(sheet) => performUpload(sheet)}
        />
      )}
      {deletingImportacao && (
        <DeleteImportacaoDialog
          importacao={deletingImportacao}
          isDeleting={isDeleting}
          onCancel={() => setDeletingImportacao(null)}
          onConfirm={confirmDelete}
        />
      )}
      {viewingDetails && (
        <ImportacaoDetailsDialog
          importacao={viewingDetails}
          organograma={
            viewingDetails.idimportacaoorganograma_id
              ? organogramById.get(viewingDetails.idimportacaoorganograma_id) ??
                null
              : null
          }
          onClose={() => setViewingDetails(null)}
          onDownload={() =>
            download(viewingDetails.download_url, viewingDetails.strnomearquivo)
          }
        />
      )}
    </RouteGuard>
  );
}

function combineImports(
  first: PaginatedResponse<ImportacaoPlanilha>,
  second: PaginatedResponse<ImportacaoPlanilha>,
  ordering: string,
): PaginatedResponse<ImportacaoPlanilha> {
  return {
    count: first.count + second.count,
    next: null,
    previous: null,
    results: [...first.results, ...second.results].sort((a, b) =>
      compareImports(a, b, ordering),
    ),
  };
}

async function listAllOrganograms(
  patriarca: number,
): Promise<PaginatedResponse<ImportacaoPlanilha>> {
  const results: ImportacaoPlanilha[] = [];
  let page = 1;
  let response: PaginatedResponse<ImportacaoPlanilha>;

  do {
    response = await listImportacoes(patriarca, 3, {
      page,
      page_size: 100,
      ordering: "-datimportacao",
    });
    results.push(...response.results);
    page += 1;
  } while (response.next);

  return {
    count: results.length,
    next: null,
    previous: null,
    results,
  };
}

function ImportStatusBadge({
  status,
  label,
}: {
  status: ImportacaoPlanilha["strstatusimportacao"];
  label: string;
}) {
  const color =
    status === "INCORPORADA" || status === "VALIDADA"
      ? "bg-emerald-100 text-emerald-800"
      : status === "REJEITADA" || status === "ERRO_PROCESSAMENTO"
        ? "bg-red-100 text-red-800"
        : status === "PROCESSANDO"
          ? "bg-blue-100 text-blue-800"
          : "bg-amber-100 text-amber-900";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}
    >
      {label}
    </span>
  );
}

function ValidationResult({ item }: { item: ImportacaoPlanilha }) {
  const result = item.relatorio_validacao;
  if (!result) return <>—</>;
  if (result.strresultado === "INVALIDO" && (
    item.strstatusimportacao === "PRONTA_PARA_INCORPORAR"
    || item.strstatusimportacao === "INCORPORADA"
  )) {
    const currentLabel = item.strstatusimportacao === "INCORPORADA"
      ? "Incorporada após tratamento"
      : "Críticas tratadas";
    return (
      <span className="text-emerald-800">
        {currentLabel}
        <span className="block text-xs text-slate-500">
          Resultado original: {result.resultado_nome}
        </span>
      </span>
    );
  }
  return <>{result.resultado_nome}</>;
}

function OrganogramCell({ id, organograma }: { id: number | null; organograma: ImportacaoPlanilha | null }) {
  if (!id) return <span className="text-slate-500">Não associado</span>;
  return (
    <div className="min-w-48">
      <span className="font-medium text-slate-900">
        {organograma?.strreferencia || organograma?.strnomearquivo || `Organograma #${id}`}
      </span>
      <span className="block text-xs text-slate-500">
        {organograma ? `${organograma.status_importacao_nome} · #${id}` : `Importação #${id}`}
      </span>
    </div>
  );
}

function formatOrganogramLabel(item: ImportacaoPlanilha) {
  return `${item.strreferencia || item.strnomearquivo} · ${item.status_importacao_nome} · #${item.idimportacaoplanilha}`;
}

function compareImports(a: ImportacaoPlanilha, b: ImportacaoPlanilha, ordering: string) {
  const descending = ordering.startsWith("-");
  const field = descending ? ordering.slice(1) : ordering;
  const direction = descending ? -1 : 1;
  if (field === "strnomearquivo") {
    return direction * a.strnomearquivo.localeCompare(b.strnomearquivo, "pt-BR");
  }
  if (field === "inttamanhoarquivo") {
    return direction * (a.inttamanhoarquivo - b.inttamanhoarquivo);
  }
  return direction * a.datimportacao.localeCompare(b.datimportacao);
}

const selectClass =
  "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
