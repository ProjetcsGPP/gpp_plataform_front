"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import useSWR from "swr";
import { Download, Eye, Loader2, Trash2, Upload } from "lucide-react";

import { AdminAlert, AdminPage, AdminPanel } from "@/components/admin/AdminPage";
import { RouteGuard } from "@/components/common/RouteGuard";
import { Button } from "@/components/ui/button";
import {
  deleteImportacao,
  downloadArquivo,
  getSheetSelectionReport,
  getValidationReport,
  latestOrganogramaUrl,
  listImportacoes,
  uploadImportacao,
} from "@/features/carga-org-lot/api";
import { DeleteImportacaoDialog } from "@/features/carga-org-lot/DeleteImportacaoDialog";
import type {
  ImportacaoPlanilha,
  PaginatedResponse,
  SheetSelectionReport,
  ValidationReport,
} from "@/features/carga-org-lot/model";
import { OrganogramaTreePanel } from "@/features/carga-org-lot/OrganogramaTreeDialog";
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
  const isOrganograma = tipoCarga === 3;
  const { can } = usePermissions();
  const { selected } = usePatriarcaSelection();
  const selectedId = selected?.idpatriarca ?? null;
  const [file, setFile] = useState<File | null>(null);
  const [tipoLotacao, setTipoLotacao] = useState<4 | 5>(4);
  const [organogramaId, setOrganogramaId] = useState<number | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "error" | "success"; message: string } | null>(null);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [sheetSelection, setSheetSelection] = useState<SheetSelectionReport | null>(null);
  const [viewingImportacao, setViewingImportacao] = useState<ImportacaoPlanilha | null>(null);
  const [deletingImportacao, setDeletingImportacao] = useState<ImportacaoPlanilha | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setOrganogramaId(null), [selectedId]);

  const listKey = selectedId
    ? ["carga-org-lot:importacoes", selectedId, isOrganograma ? "organograma" : "lotacoes"] as const
    : null;
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    listKey,
    async () => {
      if (isOrganograma) return listImportacoes(selectedId!, 3);
      const [single, packageImports] = await Promise.all([
        listImportacoes(selectedId!, 4),
        listImportacoes(selectedId!, 5),
      ]);
      return combineImports(single, packageImports);
    },
  );
  const { data: organogramas, error: organogramasError } = useSWR(
    selectedId && !isOrganograma
      ? ["carga-org-lot:organogramas-disponiveis", selectedId] as const
      : null,
    () => listImportacoes(selectedId!, 3, { page_size: 100 }),
  );

  function validateFile(): boolean {
    setFeedback(null);
    if (!selectedId || !file) {
      setFeedback({ kind: "error", message: "Selecione um arquivo para o patriarca ativo." });
      return false;
    }
    const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setFeedback({ kind: "error", message: "Selecione um arquivo .xlsx, .xls ou .ods." });
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFeedback({ kind: "error", message: "O arquivo deve ter no máximo 20 MB." });
      return false;
    }
    if (!isOrganograma && !organogramaId) {
      setFeedback({ kind: "error", message: "Selecione a versão do organograma utilizada pela lotação." });
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
      await uploadImportacao(selectedId, isOrganograma ? 3 : tipoLotacao, file, {
        aba: isOrganograma ? aba : undefined,
        organogramaId: isOrganograma ? undefined : organogramaId ?? undefined,
        onUploadProgress: ({ loaded, total }) => setProgress(total ? Math.round((loaded * 100) / total) : 0),
      });
      await mutate();
      setFile(null);
      setSheetSelection(null);
      if (inputRef.current) inputRef.current.value = "";
      setFeedback({ kind: "success", message: isOrganograma ? "Organograma importado com sucesso." : "Lotação importada com sucesso." });
    } catch (caught) {
      const selection = getSheetSelectionReport(caught);
      const validation = getValidationReport(caught);
      if (selection) {
        setSheetSelection(selection);
        setFeedback(null);
      } else {
        setSheetSelection(null);
        if (validation) {
          setReport(validation);
          setFeedback(null);
        } else {
          setFeedback({ kind: "error", message: getApiErrorMessage(caught, "Não foi possível enviar o arquivo.") });
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

  async function download(url: string, name: string) {
    setFeedback(null);
    try {
      await downloadArquivo(url, name);
    } catch (caught) {
      setFeedback({ kind: "error", message: getApiErrorMessage(caught, "Não foi possível baixar o arquivo.") });
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
      await mutate();
      setFeedback({ kind: "success", message: "Versão importada excluída definitivamente." });
    } catch (caught) {
      setDeletingImportacao(null);
      setFeedback({ kind: "error", message: getApiErrorMessage(caught, "Não foi possível excluir a versão importada.") });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <RouteGuard permission={PERMISSIONS.IMPORTACAOPLANILHA_VIEW}>
      <AdminPage
        title={isOrganograma ? "Organogramas" : "Lotações"}
        description={isOrganograma ? "Envie e consulte as versões do organograma de cada patriarca." : "Importe lotações vinculadas à versão exata do organograma utilizada."}
      >
        {viewingImportacao ? (
          <OrganogramaTreePanel importacao={viewingImportacao} onClose={() => setViewingImportacao(null)} />
        ) : <div className="space-y-5">
          {feedback && <AdminAlert variant={feedback.kind}>{feedback.message}</AdminAlert>}
          {selected && can(PERMISSIONS.IMPORTACAOPLANILHA_ADD) && (
            <AdminPanel>
              <form onSubmit={submit} className="p-4">
                <h2 className="font-semibold text-slate-900">Enviar {isOrganograma ? "organograma" : "arquivo de lotação"}</h2>
                <p className="text-xs text-slate-600">{selected.strsiglapatriarca} - {selected.strnome} · XLSX, XLS ou ODS · máximo de 20 MB</p>
                {!isOrganograma && (
                  <div className="mt-2 grid gap-2 lg:grid-cols-2">
                    <label className="text-sm text-slate-700">Tipo de carga
                      <select value={tipoLotacao} onChange={(event) => setTipoLotacao(Number(event.target.value) as 4 | 5)} className={selectClass}>
                        <option value={4}>Lotações</option>
                        <option value={5}>Lotações em pacote</option>
                      </select>
                    </label>
                    <label className="text-sm text-slate-700">Versão do organograma
                      <select value={organogramaId ?? ""} onChange={(event) => setOrganogramaId(event.target.value ? Number(event.target.value) : null)} className={selectClass} disabled={!organogramas?.results.length}>
                        <option value="">Selecione uma versão</option>
                        {organogramas?.results.map((item) => (
                          <option key={item.idimportacaoplanilha} value={item.idimportacaoplanilha}>{item.strnomearquivo} · {formatAdminDate(item.datimportacao)} · {item.strabaimportada || "sem aba"} · {item.total_itens_organograma} itens</option>
                        ))}
                      </select>
                    </label>
                    {organogramasError && <div className="lg:col-span-2"><AdminAlert>{getApiErrorMessage(organogramasError, "Não foi possível carregar as versões de organograma.")}</AdminAlert></div>}
                    {!organogramasError && organogramas && !organogramas.results.length && <p className="lg:col-span-2 text-sm text-amber-700">Importe um organograma antes de enviar uma lotação.</p>}
                  </div>
                )}
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
                  <label className="flex-1 text-sm text-slate-700">Arquivo
                    <input ref={inputRef} type="file" accept=".xlsx,.xls,.ods" className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-sm" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
                  </label>
                  <Button type="submit" disabled={!file || progress !== null || (!isOrganograma && !organogramaId)}>{progress !== null ? <Loader2 className="animate-spin" /> : <Upload />}{progress !== null ? `Enviando ${progress}%` : "Enviar arquivo"}</Button>
                </div>
                {file && <p className="mt-1 text-xs text-slate-500">Selecionado: {file.name} ({formatBytes(file.size)}) · {isOrganograma ? "Organograma" : tipoLotacao === 4 ? "Lotações" : "Lotações em pacote"}</p>}
                {progress !== null && <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={progress}><div className="h-full bg-app-primary transition-all" style={{ width: `${progress}%` }} /></div>}
              </form>
            </AdminPanel>
          )}
          {selected && isOrganograma && Boolean(data?.results.length) && <div className="flex justify-end"><Button variant="outline" onClick={() => download(latestOrganogramaUrl(selected.idpatriarca), `organograma-${selected.strsiglapatriarca}.xlsx`)}><Download /> Baixar versão mais recente</Button></div>}
          {selected && (
            <AdminPanel>
              <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold text-slate-900">Arquivos armazenados</h2></div>
              {error ? <div className="p-5"><AdminAlert><div className="flex justify-between gap-3"><span>{getApiErrorMessage(error, "Não foi possível carregar os arquivos.")}</span><Button variant="outline" size="sm" onClick={() => mutate()}>Tentar novamente</Button></div></AdminAlert></div> :
              isLoading ? <div className="p-8 text-center text-sm text-slate-500">Carregando arquivos...</div> :
              <div className="overflow-x-auto" aria-busy={isValidating}>
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-600"><tr><th className="px-5 py-3">Arquivo</th><th className="px-5 py-3">Data</th><th className="px-5 py-3">Aba</th><th className="px-5 py-3">Itens</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Ações</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">{data?.results.map((item) => <tr key={item.idimportacaoplanilha}>
                    <td className="px-5 py-3 font-medium">{item.strnomearquivo}<span className="block text-xs font-normal text-slate-500">{formatBytes(item.inttamanhoarquivo)}</span></td>
                    <td className="px-5 py-3">{formatAdminDate(item.datimportacao)}</td><td className="px-5 py-3">{item.strabaimportada || "—"}</td><td className="px-5 py-3">{isOrganograma ? item.total_itens_organograma : "—"}</td><td className="px-5 py-3">{item.status?.strdescricao ?? "—"}</td>
                    <td className="px-5 py-3"><div className="flex justify-end gap-1">
                      {isOrganograma && item.total_itens_organograma > 0 && can(PERMISSIONS.ITEMORGANOGRAMA_VIEW) && <Button variant="ghost" size="sm" onClick={() => setViewingImportacao(item)}><Eye /> Visualizar organograma</Button>}
                      <Button variant="ghost" size="sm" onClick={() => download(item.download_url, item.strnomearquivo)}><Download /> Baixar</Button>
                      {can(PERMISSIONS.IMPORTACAOPLANILHA_DELETE) && <Button variant="ghost" size="sm" className="text-red-700" onClick={() => setDeletingImportacao(item)}><Trash2 /> Excluir</Button>}
                    </div></td>
                  </tr>)}</tbody>
                </table>
                {!data?.results.length && <div className="p-10 text-center text-sm text-slate-500">Nenhum arquivo enviado para este patriarca.</div>}
              </div>}
            </AdminPanel>
          )}
        </div>}
      </AdminPage>
      {report && <ValidationReportDialog report={report} onClose={() => setReport(null)} />}
      {sheetSelection && <SheetSelectionDialog report={sheetSelection} isSubmitting={progress !== null} onCancel={() => setSheetSelection(null)} onConfirm={(sheet) => performUpload(sheet)} />}
      {deletingImportacao && <DeleteImportacaoDialog importacao={deletingImportacao} isDeleting={isDeleting} onCancel={() => setDeletingImportacao(null)} onConfirm={confirmDelete} />}
    </RouteGuard>
  );
}

function combineImports(first: PaginatedResponse<ImportacaoPlanilha>, second: PaginatedResponse<ImportacaoPlanilha>): PaginatedResponse<ImportacaoPlanilha> {
  return { count: first.count + second.count, next: null, previous: null, results: [...first.results, ...second.results].sort((a, b) => b.datimportacao.localeCompare(a.datimportacao) || b.idimportacaoplanilha - a.idimportacaoplanilha) };
}

const selectClass = "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
