"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Eye, RefreshCw } from "lucide-react";

import { AdminDataTable, type AdminTableColumn } from "@/components/admin/AdminDataTable";
import { AdminAlert } from "@/components/admin/AdminPage";
import { Button } from "@/components/ui/button";
import {
  EdocsFilters,
  EdocsSelectFilter,
  EdocsTextFilter,
} from "@/features/publicacoes/edocs/EdocsUi";
import {
  listColetasMensaisEdocs,
  reencaminharColetaMensalEdocs,
} from "@/features/publicacoes/edocs/mensal/api";
import {
  edocsMensalCacheKeys,
  revalidateColetaMensalEdocsCaches,
} from "@/features/publicacoes/edocs/mensal/cache";
import { ColetaMensalEdocsDetails } from "@/features/publicacoes/edocs/mensal/ColetaMensalEdocsDetails";
import type {
  ColetaMensalEdocs,
  SituacaoColetaMensalEdocs,
} from "@/features/publicacoes/edocs/mensal/model";
import { formatCompetence, MonthlyStatus } from "@/features/publicacoes/edocs/mensal/ui";
import { edocsOrdering, nextEdocsSorting } from "@/features/publicacoes/edocs/table";
import { usePermissions } from "@/hooks/usePermissions";
import { formatAdminDate } from "@/lib/adminResource";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { PERMISSIONS } from "@/lib/permissions";
import type { AdminSortRule, AdminTableDensity } from "@/types/admin";

type SortKey = "ano" | "mes" | "revisao" | "situacao" | "criado_em";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
] as const;

export function ColetaMensalEdocsRevisions() {
  const { can } = usePermissions();
  const { mutate: mutateCache } = useSWRConfig();
  const [reenqueueingId, setReenqueueingId] = useState<string | null>(null);
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const ordering = edocsOrdering(sorting);
  const canRequest = can(PERMISSIONS.EDOCS_MENSAL_COLETA_SOLICITAR);
  const key = edocsMensalCacheKeys.coletas([
    page, pageSize, year, month, status, ordering,
  ]);
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    () => listColetasMensaisEdocs({
      page,
      page_size: pageSize,
      ano: parseOptionalInteger(year),
      mes: parseOptionalInteger(month),
      situacao: (status || undefined) as SituacaoColetaMensalEdocs | undefined,
      ordering,
    }),
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      refreshInterval: monthlyCollectionRefreshInterval,
    },
  );
  const selected = data?.results.find((item) => item.id === selectedId) ?? null;

  async function reenqueueCollection(coleta: ColetaMensalEdocs) {
    setReenqueueingId(coleta.id);
    setFeedback(null);
    try {
      await reencaminharColetaMensalEdocs(coleta.id);
      await revalidateColetaMensalEdocsCaches(mutateCache, coleta.id);
      setFeedback({
        kind: "success",
        message: `A solicitação de ${formatCompetence(coleta.ano, coleta.mes)} foi reencaminhada sem criar uma nova revisão.`,
      });
    } catch (caught) {
      setFeedback({
        kind: "error",
        message: getApiErrorMessage(
          caught,
          "Não foi possível reencaminhar a solicitação da coleta.",
        ),
      });
    } finally {
      setReenqueueingId(null);
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
        <div className="flex justify-end gap-2">
          {canRequest &&
            row.situacao === "SOLICITADA" &&
            row.acoes_disponiveis.includes("reencaminhar") && (
              <Button
                variant="outline"
                size="sm"
                disabled={reenqueueingId === row.id}
                onClick={() => reenqueueCollection(row)}
              >
                <RefreshCw aria-hidden="true" />
                {reenqueueingId === row.id
                  ? "Reencaminhando..."
                  : "Reencaminhar solicitação"}
              </Button>
            )}
          <Button variant="outline" size="sm" onClick={() => setSelectedId(row.id)}>
            <Eye aria-hidden="true" /> Visualizar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3" data-testid="monthly-revisions">
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
            <option value="SOLICITADA">Solicitada</option>
            <option value="EXECUTANDO">Executando</option>
            <option value="SUCESSO">Sucesso</option>
            <option value="ERRO">Erro</option>
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

      {selected && (
        <ColetaMensalEdocsDetails
          coleta={selected}
          canViewPatriarcas={can(PERMISSIONS.EDOCS_MENSAL_RESULTADO_PATRIARCA_VIEW)}
          canViewOrganizacoes={can(PERMISSIONS.EDOCS_MENSAL_RESULTADO_ORGANIZACAO_VIEW)}
          canViewFontes={can(PERMISSIONS.EDOCS_MENSAL_FONTE_BRUTA_VIEW)}
          canViewAudit={can(PERMISSIONS.EDOCS_MENSAL_EVENTO_AUDITORIA_VIEW)}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

export function monthlyCollectionRefreshInterval(
  latest?: { results: ColetaMensalEdocs[] },
) {
  return latest?.results.some((item) => item.situacao === "EXECUTANDO")
    ? 5_000
    : 0;
}

function parseOptionalInteger(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
}
