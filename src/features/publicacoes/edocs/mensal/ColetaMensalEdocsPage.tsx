"use client";

import axios from "axios";
import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { CalendarPlus, Eye } from "lucide-react";

import {
  AdminDataTable,
  type AdminTableColumn,
} from "@/components/admin/AdminDataTable";
import { AdminAlert, AdminPanel } from "@/components/admin/AdminPage";
import { AdminLoading } from "@/components/admin/AdminLoading";
import { RouteGuard } from "@/components/common/RouteGuard";
import { Button } from "@/components/ui/button";
import {
  EdocsFilters,
  EdocsPage,
  EdocsSelectFilter,
  EdocsTextFilter,
} from "@/features/publicacoes/edocs/EdocsUi";
import {
  listColetasMensaisEdocs,
  solicitarColetaMensalEdocs,
} from "@/features/publicacoes/edocs/mensal/api";
import { edocsMensalCacheKeys } from "@/features/publicacoes/edocs/mensal/cache";
import { ColetaMensalEdocsDetails } from "@/features/publicacoes/edocs/mensal/ColetaMensalEdocsDetails";
import type {
  ColetaMensalEdocs,
  SituacaoColetaMensalEdocs,
} from "@/features/publicacoes/edocs/mensal/model";
import {
  formatCompetence,
  MonthlyStatus,
} from "@/features/publicacoes/edocs/mensal/ui";
import {
  edocsOrdering,
  nextEdocsSorting,
} from "@/features/publicacoes/edocs/table";
import { usePermissions } from "@/hooks/usePermissions";
import { formatAdminDate } from "@/lib/adminResource";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { PERMISSIONS } from "@/lib/permissions";
import type { AdminSortRule, AdminTableDensity } from "@/types/admin";

type SortKey = "ano" | "mes" | "revisao" | "situacao" | "criado_em";

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

export function ColetaMensalEdocsPage() {
  const now = new Date();
  const { can } = usePermissions();
  const { mutate: mutateCache } = useSWRConfig();
  const [requestYear, setRequestYear] = useState(String(now.getFullYear()));
  const [requestMonth, setRequestMonth] = useState(String(now.getMonth() + 1));
  const [requesting, setRequesting] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: "error" | "success";
    message: string;
  } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [status, setStatus] = useState("");
  const [density, setDensity] = useState<AdminTableDensity>("compact");
  const [sorting, setSorting] = useState<AdminSortRule<SortKey>[]>([
    { key: "ano", direction: "desc" },
    { key: "mes", direction: "desc" },
    { key: "revisao", direction: "desc" },
  ]);
  const [selected, setSelected] = useState<ColetaMensalEdocs | null>(null);
  const ordering = edocsOrdering(sorting);
  const canRequest = can(PERMISSIONS.EDOCS_MENSAL_COLETA_SOLICITAR);
  const key = edocsMensalCacheKeys.coletas([
    page,
    pageSize,
    year,
    month,
    status,
    ordering,
  ]);
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    () =>
      listColetasMensaisEdocs({
        page,
        page_size: pageSize,
        ano: parseOptionalInteger(year),
        mes: parseOptionalInteger(month),
        situacao: (status || undefined) as SituacaoColetaMensalEdocs | undefined,
        ordering,
      }),
    { keepPreviousData: true, revalidateOnFocus: false },
  );

  async function requestCollection() {
    const ano = Number(requestYear);
    const mes = Number(requestMonth);
    if (!Number.isInteger(ano) || !Number.isInteger(mes)) return;

    setRequesting(true);
    setFeedback(null);
    try {
      const created = await solicitarColetaMensalEdocs({ ano, mes });
      setFeedback({
        kind: "success",
        message: `Coleta de ${formatCompetence(created.ano, created.mes)} agendada como revisão ${created.revisao}.`,
      });
      await mutateCache(
        (cacheKey) =>
          Array.isArray(cacheKey) &&
          cacheKey[0] === "pub-institucional:edocs" &&
          cacheKey[1] === "mensal-coletas",
        undefined,
        { revalidate: true },
      );
    } catch (caught) {
      const conflict = axios.isAxiosError(caught) && caught.response?.status === 409;
      setFeedback({
        kind: "error",
        message: getApiErrorMessage(
          caught,
          conflict
            ? "Já existe uma coleta ativa para esta competência. Aguarde sua conclusão antes de solicitar outra revisão."
            : "Não foi possível solicitar a coleta mensal E-Docs.",
        ),
      });
    } finally {
      setRequesting(false);
    }
  }

  function changeFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  function toggleSort(sortKey: SortKey, additive: boolean) {
    setPage(1);
    setSorting((current) => nextEdocsSorting(current, sortKey, additive));
  }

  const columns: AdminTableColumn<ColetaMensalEdocs, SortKey>[] = [
    {
      key: "competencia",
      label: "Competência",
      sortKey: "ano",
      render: (row) => <strong>{formatCompetence(row.ano, row.mes)}</strong>,
    },
    {
      key: "revisao",
      label: "Revisão",
      sortKey: "revisao",
      render: (row) => row.revisao,
    },
    { key: "ambiente", label: "Ambiente", render: (row) => row.ambiente },
    {
      key: "situacao",
      label: "Situação",
      sortKey: "situacao",
      render: (row) => <MonthlyStatus status={row.situacao} />,
    },
    {
      key: "quantidades",
      label: "Resultados",
      render: (row) => (
        <span className="text-xs text-slate-600">
          {row.quantidade_patriarcas} patriarcas · {row.quantidade_organizacoes} organizações · {row.quantidade_fontes_brutas} fontes
        </span>
      ),
    },
    {
      key: "criada",
      label: "Solicitada em",
      sortKey: "criado_em",
      render: (row) => formatAdminDate(row.criado_em),
    },
    {
      key: "acoes",
      label: "Ações",
      headerClassName: "text-right",
      className: "text-right",
      render: (row) => (
        <Button variant="outline" size="sm" onClick={() => setSelected(row)}>
          <Eye aria-hidden="true" /> Visualizar
        </Button>
      ),
    },
  ];

  return (
    <RouteGuard
      permission={PERMISSIONS.EDOCS_MENSAL_COLETA_VIEW}
      loadingFallback={<AdminLoading label="Verificando acesso às coletas mensais..." />}
    >
      <EdocsPage
        title="Coleta de Dados — E-Docs"
        description="Solicite e consulte revisões mensais dos indicadores E-Docs. A coleta é independente de qualquer publicação."
      >
        <div className="space-y-6">
          {canRequest && (
            <AdminPanel className="p-5" aria-labelledby="monthly-request-title">
              <div className="flex items-start gap-3">
                <span className="rounded-lg bg-sky-100 p-2 text-sky-700">
                  <CalendarPlus aria-hidden="true" />
                </span>
                <div className="flex-1">
                  <h2 id="monthly-request-title" className="font-semibold text-slate-900">
                    Nova coleta mensal
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Cada solicitação cria uma nova revisão da competência. Ela não aprova nem publica dados.
                  </p>
                  <div className="mt-4 flex flex-wrap items-end gap-3">
                    <label className="text-xs font-medium text-slate-600">
                      Ano da nova coleta
                      <input
                        type="number"
                        className="mt-1 block w-32 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                        value={requestYear}
                        onChange={(event) => setRequestYear(event.target.value)}
                      />
                    </label>
                    <EdocsSelectFilter label="Mês da nova coleta" value={requestMonth} onChange={setRequestMonth}>
                      {MONTHS.map((label, index) => (
                        <option key={label} value={index + 1}>{label}</option>
                      ))}
                    </EdocsSelectFilter>
                    <Button
                      onClick={requestCollection}
                      disabled={
                        requesting ||
                        !Number.isInteger(Number(requestYear)) ||
                        !Number.isInteger(Number(requestMonth))
                      }
                    >
                      <CalendarPlus aria-hidden="true" />
                      {requesting ? "Solicitando..." : "Solicitar nova revisão"}
                    </Button>
                  </div>
                </div>
              </div>
            </AdminPanel>
          )}

          {feedback && (
            <AdminAlert variant={feedback.kind} onClose={() => setFeedback(null)}>
              {feedback.message}
            </AdminAlert>
          )}

          <section aria-labelledby="monthly-history-title">
            <div className="mb-3">
              <h2 id="monthly-history-title" className="text-lg font-semibold text-slate-900">
                Revisões mensais
              </h2>
              <p className="text-sm text-slate-600">
                Histórico de coletas e resultados preservados pelo backend.
              </p>
            </div>
            <EdocsFilters>
              <EdocsTextFilter
                label="Ano"
                value={year}
                placeholder="Ex.: 2024"
                onChange={(value) => changeFilter(setYear, value)}
              />
              <EdocsSelectFilter
                label="Mês"
                value={month}
                onChange={(value) => changeFilter(setMonth, value)}
              >
                <option value="">Todos</option>
                {MONTHS.map((label, index) => (
                  <option key={label} value={index + 1}>{label}</option>
                ))}
              </EdocsSelectFilter>
              <EdocsSelectFilter
                label="Situação"
                value={status}
                onChange={(value) => changeFilter(setStatus, value)}
              >
                <option value="">Todas</option>
                <option value="AGENDADA">Agendada</option>
                <option value="EM_EXECUCAO">Em execução</option>
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
                setSorting([
                  { key: "ano", direction: "desc" },
                  { key: "mes", direction: "desc" },
                  { key: "revisao", direction: "desc" },
                ]);
                setDensity("compact");
              }}
              isLoading={isLoading}
              isRefreshing={isValidating && Boolean(data)}
              errorMessage={
                error
                  ? getApiErrorMessage(error, "Não foi possível carregar as coletas mensais E-Docs.")
                  : null
              }
              onRetry={() => mutate()}
              emptyMessage="Nenhuma coleta mensal E-Docs registrada."
            />
          </section>
        </div>
      </EdocsPage>

      {selected && (
        <ColetaMensalEdocsDetails
          coleta={selected}
          canViewPatriarcas={can(PERMISSIONS.EDOCS_MENSAL_RESULTADO_PATRIARCA_VIEW)}
          canViewOrganizacoes={can(PERMISSIONS.EDOCS_MENSAL_RESULTADO_ORGANIZACAO_VIEW)}
          canViewFontes={can(PERMISSIONS.EDOCS_MENSAL_FONTE_BRUTA_VIEW)}
          canViewAudit={can(PERMISSIONS.EDOCS_MENSAL_EVENTO_AUDITORIA_VIEW)}
          onClose={() => setSelected(null)}
        />
      )}
    </RouteGuard>
  );
}

function parseOptionalInteger(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
}
