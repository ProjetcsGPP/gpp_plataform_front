"use client";

import { useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Eye, Upload } from "lucide-react";

import {
  AdminDataTable,
  type AdminTableColumn,
} from "@/components/admin/AdminDataTable";
import { AdminAlert, AdminPanel } from "@/components/admin/AdminPage";
import { AdminLoading } from "@/components/admin/AdminLoading";
import { RouteGuard } from "@/components/common/RouteGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getMinhaPreferenciaEflow,
  importarColetaEflow,
  listColetasEflow,
} from "@/features/publicacoes/eflow/api";
import {
  EFLOW_CACHE_PREFIX,
  eflowCacheKeys,
  revalidateEflowCaches,
} from "@/features/publicacoes/eflow/cache";
import { EflowDetailsDialog } from "@/features/publicacoes/eflow/EflowDetailsDialog";
import { formatFileSize } from "@/features/publicacoes/eflow/format";
import type {
  ColetaEflow,
  PerfilCalculoEflow,
  PreferenciaExibicaoEflow,
  SituacaoColetaEflow,
} from "@/features/publicacoes/eflow/model";
import { findResultByProfile } from "@/features/publicacoes/eflow/profiles";
import {
  EdocsFilters,
  EdocsPage,
  EdocsSelectFilter,
  EdocsStatusBadge,
} from "@/features/publicacoes/edocs/EdocsUi";
import {
  edocsOrdering,
  nextEdocsSorting,
} from "@/features/publicacoes/edocs/table";
import { usePermissions } from "@/hooks/usePermissions";
import { formatAdminDate } from "@/lib/adminResource";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { PERMISSIONS } from "@/lib/permissions";
import type { AdminSortRule, AdminTableDensity } from "@/types/admin";

type SortKey = "iniciada_em" | "concluida_em" | "situacao";

export function EflowPage() {
  const { can } = usePermissions();
  const { mutate: mutateCache } = useSWRConfig();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [validFromYear, setValidFromYear] = useState(new Date().getFullYear());
  const [validFromMonth, setValidFromMonth] = useState(new Date().getMonth() + 1);
  const [retroactive, setRetroactive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{
    kind: "error" | "success";
    message: string;
  } | null>(null);
  const [lastResult, setLastResult] = useState<ColetaEflow | null>(null);
  const [selected, setSelected] = useState<ColetaEflow | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState("");
  const [density, setDensity] = useState<AdminTableDensity>("compact");
  const [sorting, setSorting] = useState<AdminSortRule<SortKey>[]>([
    { key: "iniciada_em", direction: "desc" },
  ]);
  const ordering = edocsOrdering(sorting);
  const canImport = can(PERMISSIONS.EFLOW_COLETA_IMPORTAR);
  const canViewDefinitions = can(PERMISSIONS.EFLOW_DEFINICAO_VIEW);
  const canViewAudit = can(PERMISSIONS.EFLOW_EVENTO_AUDITORIA_VIEW);
  const canViewResults = can(PERMISSIONS.EFLOW_RESULTADO_VIEW);
  const canViewPreference = can(PERMISSIONS.EFLOW_PREFERENCIA_VIEW);
  const canChangePreference = can(PERMISSIONS.EFLOW_PREFERENCIA_ALTERAR);
  const canViewPreferenceAudit = can(
    PERMISSIONS.EFLOW_PREFERENCIA_AUDITORIA_VIEW,
  );
  const key = eflowCacheKeys.coletas([page, pageSize, status, ordering]);
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    () =>
      listColetasEflow({
        page,
        page_size: pageSize,
        ordering,
        situacao: (status || undefined) as SituacaoColetaEflow | undefined,
      }),
    { keepPreviousData: true, revalidateOnFocus: false },
  );
  const preferenceKey = canViewPreference
    ? eflowCacheKeys.preferencia()
    : null;
  const {
    data: preference,
    error: preferenceError,
    isLoading: preferenceLoading,
    mutate: mutatePreference,
  } = useSWR(preferenceKey, getMinhaPreferenciaEflow, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  async function handleUpload() {
    if (!file) {
      setUploadFeedback({
        kind: "error",
        message: "Selecione um arquivo CSV antes de importar.",
      });
      fileInputRef.current?.focus();
      return;
    }

    setUploading(true);
    setUploadFeedback(null);
    setLastResult(null);
    try {
      const created = await importarColetaEflow({
        arquivo: file,
        ano_vigencia_inicio: validFromYear,
        mes_vigencia_inicio: validFromMonth,
        vigencia_retroativa: retroactive,
      });
      setLastResult(created);
      setUploadFeedback({
        kind: created.situacao === "FALHOU" ? "error" : "success",
        message:
          created.situacao === "FALHOU"
            ? created.mensagem_erro ||
              "O snapshot foi preservado, mas seu processamento falhou."
            : "Snapshot E-Flow importado e indicadores registrados.",
      });
      await revalidateEflowCaches(mutateCache);
    } catch (caught) {
      setUploadFeedback({
        kind: "error",
        message: getApiErrorMessage(
          caught,
          "Não foi possível importar o arquivo E-Flow.",
        ),
      });
      fileInputRef.current?.focus();
    } finally {
      setUploading(false);
    }
  }

  function toggleSort(sortKey: SortKey, additive: boolean) {
    setPage(1);
    setSorting((current) => nextEdocsSorting(current, sortKey, additive));
  }

  const columns: AdminTableColumn<ColetaEflow, SortKey>[] = [
    {
      key: "inicio",
      label: "Data e hora",
      sortKey: "iniciada_em",
      render: (row) => formatAdminDate(row.iniciada_em),
    },
    {
      key: "arquivo",
      label: "Arquivo",
      render: (row) => row.arquivo_nome,
    },
    {
      key: "vigencia",
      label: "Início da vigência",
      render: (row) => (
        <div>
          <span>{String(row.mes_vigencia_inicio).padStart(2, "0")}/{row.ano_vigencia_inicio}</span>
          {row.vigencia_retroativa && (
            <span className="block text-xs text-amber-700">Base retroativa</span>
          )}
        </div>
      ),
    },
    {
      key: "situacao",
      label: "Situação",
      sortKey: "situacao",
      render: (row) => <EflowStatus situacao={row.situacao} />,
    },
    {
      key: "fluxos",
      label: "Fluxos",
      render: (row) =>
        formatResultValue(row, preference?.perfil_preferido, "quantidade_fluxos"),
    },
    {
      key: "orgaos",
      label: "Órgãos",
      render: (row) =>
        formatResultValue(
          row,
          preference?.perfil_preferido,
          "quantidade_orgaos_participantes",
        ),
    },
    {
      key: "setores",
      label: "Setores ativos",
      render: (row) =>
        formatResultValue(
          row,
          preference?.perfil_preferido,
          "quantidade_setores_ativos",
        ),
    },
    {
      key: "responsavel",
      label: "Responsável",
      render: (row) => row.criado_por_nome || "Sistema",
    },
    {
      key: "acoes",
      label: "Ações",
      headerClassName: "text-right",
      className: "text-right",
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          disabled={!preference || preferenceLoading || Boolean(preferenceError)}
          onClick={() => setSelected(row)}
        >
          <Eye aria-hidden="true" /> Consultar detalhes
        </Button>
      ),
    },
  ];

  return (
    <RouteGuard
      permission={PERMISSIONS.EFLOW_COLETA_VIEW}
      loadingFallback={<AdminLoading label="Verificando acesso ao E-Flow..." />}
    >
      <EdocsPage
        title="Coleta de Dados — E-Flow"
        description="Importe snapshots CSV exportados pelo E-Flow Admin e consulte seu histórico auditável. A coleta não cria nem altera publicações."
      >
        <div className="space-y-6">
          {canViewPreference && preferenceLoading && (
            <div role="status" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Carregando sua preferência de exibição E-Flow...
            </div>
          )}
          {canViewPreference && preferenceError && (
            <AdminAlert>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>
                  {getApiErrorMessage(
                    preferenceError,
                    "Não foi possível carregar sua preferência E-Flow.",
                  )}
                </span>
                <Button variant="outline" size="sm" onClick={() => mutatePreference()}>
                  Tentar novamente
                </Button>
              </div>
            </AdminAlert>
          )}
          {!canViewPreference && (
            <AdminAlert>
              Você não possui permissão para consultar a preferência de exibição E-Flow.
            </AdminAlert>
          )}
          {canImport && (
            <AdminPanel className="p-5" aria-labelledby="eflow-upload-title">
              <div className="flex items-start gap-3">
                <span className="rounded-lg bg-sky-100 p-2 text-sky-700">
                  <Upload aria-hidden="true" />
                </span>
                <div className="flex-1">
                  <h2 id="eflow-upload-title" className="font-semibold text-slate-900">
                    Importar exportação E-Flow
                  </h2>
                  <p id="eflow-upload-help" className="mt-1 text-sm text-slate-600">
                    Selecione o CSV original. Cada envio cria um novo snapshot independente.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem_10rem_auto] sm:items-end">
                    <label className="flex-1 text-xs font-medium text-slate-600">
                      Arquivo CSV
                      <Input
                        ref={fileInputRef}
                        className="mt-1 bg-white"
                        type="file"
                        accept=".csv,text/csv"
                        aria-describedby="eflow-upload-help eflow-file-summary"
                        onChange={(event) => {
                          setFile(event.target.files?.[0] ?? null);
                          setUploadFeedback(null);
                          setLastResult(null);
                        }}
                      />
                    </label>
                    <label className="text-xs font-medium text-slate-600">
                      Ano de início
                      <Input className="mt-1 bg-white" type="number" min={2024} value={validFromYear} onChange={(event) => setValidFromYear(Number(event.target.value))} />
                    </label>
                    <label className="text-xs font-medium text-slate-600">
                      Mês de início
                      <select className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" value={validFromMonth} onChange={(event) => setValidFromMonth(Number(event.target.value))}>
                        {Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{String(index + 1).padStart(2, "0")}</option>)}
                      </select>
                    </label>
                    <Button onClick={handleUpload} disabled={!file || uploading || validFromYear < 2024 || !Number.isInteger(validFromYear)}>
                      <Upload aria-hidden="true" />
                      {uploading ? "Importando..." : "Importar CSV"}
                    </Button>
                  </div>
                  <label className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                    <input type="checkbox" className="mt-1" checked={retroactive} onChange={(event) => setRetroactive(event.target.checked)} />
                    <span><strong>Usar como melhor informação histórica disponível.</strong><span className="block text-xs">A vigência retroativa não comprova que esta fotografia do arquivo já existia na competência inicial informada.</span></span>
                  </label>
                  {validFromYear < 2024 && <p className="mt-2 text-sm text-red-700">O início da série histórica é janeiro de 2024.</p>}
                  <p id="eflow-file-summary" className="mt-2 text-xs text-slate-500">
                    {file
                      ? `${file.name} — ${formatFileSize(file.size)}`
                      : "Nenhum arquivo selecionado."}
                  </p>
                </div>
              </div>
            </AdminPanel>
          )}

          {uploadFeedback && (
            <AdminAlert
              variant={uploadFeedback.kind}
              onClose={() => setUploadFeedback(null)}
            >
              {uploadFeedback.message}
            </AdminAlert>
          )}

          {lastResult && (
            <ImportResult
              coleta={lastResult}
              preference={preference}
              onDetails={() => setSelected(lastResult)}
            />
          )}

          <section aria-labelledby="eflow-history-title">
            <div className="mb-3">
              <h2 id="eflow-history-title" className="text-lg font-semibold text-slate-900">
                Histórico de coletas
              </h2>
              <p className="text-sm text-slate-600">
                Snapshots preservados e indicadores calculados pelo backend.
              </p>
            </div>
            <EdocsFilters>
              <EdocsSelectFilter
                label="Situação"
                value={status}
                onChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
              >
                <option value="">Todas</option>
                <option value="EM_PROCESSAMENTO">Em processamento</option>
                <option value="CONCLUIDA">Concluída</option>
                <option value="FALHOU">Falhou</option>
              </EdocsSelectFilter>
            </EdocsFilters>
            <AdminDataTable
              rows={data?.results ?? []}
              columns={columns}
              getRowKey={(row) => row.id}
              sorting={sorting}
              onSort={toggleSort}
              page={page}
              pageSize={pageSize}
              pageSizeOptions={[10, 20, 50]}
              totalCount={data?.count ?? 0}
              hasPreviousPage={Boolean(data?.previous)}
              hasNextPage={Boolean(data?.next)}
              onPageChange={setPage}
              onPageSizeChange={(value) => {
                setPageSize(value);
                setPage(1);
              }}
              density={density}
              onDensityChange={setDensity}
              onResetView={() => {
                setSorting([{ key: "iniciada_em", direction: "desc" }]);
                setDensity("compact");
              }}
              isLoading={isLoading}
              isRefreshing={isValidating && Boolean(data)}
              errorMessage={
                error
                  ? getApiErrorMessage(
                      error,
                      "Não foi possível carregar as coletas E-Flow.",
                    )
                  : null
              }
              onRetry={() => mutate()}
              emptyMessage="Nenhuma coleta E-Flow registrada."
            />
          </section>
        </div>
      </EdocsPage>

      {selected && preference && (
        <EflowDetailsDialog
          coleta={selected}
          preference={preference}
          canViewResults={canViewResults}
          canChangePreference={canChangePreference}
          canViewPreferenceAudit={canViewPreferenceAudit}
          canViewDefinitions={canViewDefinitions}
          canViewAudit={canViewAudit}
          onPreferenceChanged={async (updated) => {
            await mutatePreference(updated, { revalidate: false });
            void mutateCache(
              (cacheKey) =>
                Array.isArray(cacheKey) &&
                cacheKey[0] === EFLOW_CACHE_PREFIX &&
                cacheKey[1] === "auditoria-preferencia",
              undefined,
              { revalidate: true },
            ).catch(() => undefined);
          }}
          onClose={() => setSelected(null)}
        />
      )}
    </RouteGuard>
  );
}

function EflowStatus({ situacao }: { situacao: SituacaoColetaEflow }) {
  return (
    <EdocsStatusBadge
      positive={situacao === "CONCLUIDA"}
      negative={situacao === "FALHOU"}
    >
      {situacao.replaceAll("_", " ")}
    </EdocsStatusBadge>
  );
}

function ImportResult({
  coleta,
  preference,
  onDetails,
}: {
  coleta: ColetaEflow;
  preference?: PreferenciaExibicaoEflow;
  onDetails: () => void;
}) {
  const result = preference
    ? findResultByProfile(coleta, preference.perfil_preferido)
    : undefined;
  return (
    <AdminPanel className="p-5" aria-labelledby="eflow-result-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="eflow-result-title" className="font-semibold text-slate-900">
            Resultado da importação
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <EflowStatus situacao={coleta.situacao} />
            <span>{coleta.arquivo_nome}</span>
            <span>{formatFileSize(coleta.arquivo_tamanho_bytes)}</span>
            <span>Vigência desde {String(coleta.mes_vigencia_inicio).padStart(2, "0")}/{coleta.ano_vigencia_inicio}{coleta.vigencia_retroativa ? " (retroativa)" : ""}</span>
            {result && (
              <span>{result.quantidade_fluxos.toLocaleString("pt-BR")} fluxos</span>
            )}
          </div>
          {coleta.codigo_erro && (
            <p className="mt-2 text-sm text-red-700">
              <strong>{coleta.codigo_erro}:</strong> {coleta.mensagem_erro}
            </p>
          )}
        </div>
        <Button variant="outline" onClick={onDetails} disabled={!preference}>
          <Eye aria-hidden="true" /> Consultar detalhes
        </Button>
      </div>
    </AdminPanel>
  );
}

function formatResultValue(
  coleta: ColetaEflow,
  profile: PerfilCalculoEflow | undefined,
  field:
    | "quantidade_fluxos"
    | "quantidade_orgaos_participantes"
    | "quantidade_setores_ativos",
): string {
  if (!profile) return "—";
  const result = findResultByProfile(coleta, profile);
  return result ? result[field].toLocaleString("pt-BR") : "—";
}
