"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { RefreshCw } from "lucide-react";

import { AdminDataTable, type AdminTableColumn } from "@/components/admin/AdminDataTable";
import { AdminAlert } from "@/components/admin/AdminPage";
import { AdminLoading } from "@/components/admin/AdminLoading";
import { RouteGuard } from "@/components/common/RouteGuard";
import { Button } from "@/components/ui/button";
import { listColetasEdocs, solicitarColetaEdocs } from "@/features/publicacoes/edocs/api";
import { edocsCacheKeys, revalidateEdocsCaches } from "@/features/publicacoes/edocs/cache";
import {
  EdocsFilters,
  EdocsModal,
  EdocsPage,
  EdocsSelectFilter,
  EdocsStatusBadge,
} from "@/features/publicacoes/edocs/EdocsUi";
import type { ColetaPatriarcasEdocs } from "@/features/publicacoes/edocs/model";
import { edocsOrdering, nextEdocsSorting } from "@/features/publicacoes/edocs/table";
import { usePermissions } from "@/hooks/usePermissions";
import { formatAdminDate } from "@/lib/adminResource";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { PERMISSIONS } from "@/lib/permissions";
import type { AdminSortRule, AdminTableDensity } from "@/types/admin";

type SortKey = "iniciada_em" | "concluida_em" | "situacao";

export function ColetasEdocsPage() {
  const { can } = usePermissions();
  const { mutate: mutateCache } = useSWRConfig();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState("");
  const [density, setDensity] = useState<AdminTableDensity>("compact");
  const [sorting, setSorting] = useState<AdminSortRule<SortKey>[]>([
    { key: "iniciada_em", direction: "desc" },
  ]);
  const [confirming, setConfirming] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: "error" | "success";
    message: string;
  } | null>(null);
  const ordering = edocsOrdering(sorting);
  const key = edocsCacheKeys.coletas([page, pageSize, status, ordering]);
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    () =>
      listColetasEdocs({
        page,
        page_size: pageSize,
        ordering,
        situacao: status || undefined,
      }),
    { keepPreviousData: true, revalidateOnFocus: false },
  );

  function toggleSort(sortKey: SortKey, additive: boolean) {
    setPage(1);
    setSorting((current) => nextEdocsSorting(current, sortKey, additive));
  }

  const columns: AdminTableColumn<ColetaPatriarcasEdocs, SortKey>[] = [
    {
      key: "inicio",
      label: "Início",
      sortKey: "iniciada_em",
      render: (row) => formatAdminDate(row.iniciada_em),
    },
    {
      key: "conclusao",
      label: "Conclusão",
      sortKey: "concluida_em",
      render: (row) => row.concluida_em ? formatAdminDate(row.concluida_em) : "—",
    },
    {
      key: "ambiente",
      label: "Ambiente",
      render: (row) => row.ambiente,
    },
    {
      key: "situacao",
      label: "Situação",
      sortKey: "situacao",
      render: (row) => (
        <div>
          <EdocsStatusBadge
            positive={row.situacao.startsWith("CONCLUIDA")}
            negative={row.situacao === "FALHOU"}
          >
            {row.situacao.replaceAll("_", " ")}
          </EdocsStatusBadge>
          {row.mensagem_erro && (
            <span className="mt-1 block max-w-64 text-xs text-red-700">
              {row.mensagem_erro}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "quantidades",
      label: "Resultado",
      render: (row) => (
        <div className="text-xs leading-5 text-slate-600">
          <span className="block">{row.quantidade_observados} observados</span>
          <span className="block">{row.quantidade_pendentes} pendentes</span>
        </div>
      ),
    },
    {
      key: "divergencias",
      label: "Comparação",
      render: (row) => (
        <div className="text-xs leading-5 text-slate-600">
          <span className="block">{row.quantidade_novos} novos</span>
          <span className="block">{row.quantidade_alterados} alterados</span>
          <span className="block">{row.quantidade_ausentes} ausentes</span>
        </div>
      ),
    },
    {
      key: "responsavel",
      label: "Solicitado por",
      render: (row) => row.criado_por_nome || "Sistema",
    },
  ];

  return (
    <RouteGuard
      permission={PERMISSIONS.EDOCS_COLETA_VIEW}
      loadingFallback={<AdminLoading label="Verificando acesso às coletas..." />}
    >
      <EdocsPage
        title="Coletas E-Docs"
        description="Execuções persistidas de consulta e comparação com o catálogo remoto."
        actions={
          can(PERMISSIONS.EDOCS_PATRIARCA_SOLICITAR_COLETA) ? (
            <Button onClick={() => setConfirming(true)}>
              <RefreshCw aria-hidden="true" /> Solicitar coleta
            </Button>
          ) : undefined
        }
      >
        {feedback && (
          <div className="mb-4">
            <AdminAlert
              variant={feedback.kind}
              onClose={() => setFeedback(null)}
            >
              {feedback.message}
            </AdminAlert>
          </div>
        )}
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
            <option value="EM_EXECUCAO">Em execução</option>
            <option value="CONCLUIDA">Concluída</option>
            <option value="CONCLUIDA_COM_DIVERGENCIAS">
              Concluída com divergências
            </option>
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
              ? getApiErrorMessage(error, "Não foi possível carregar as coletas.")
              : null
          }
          onRetry={() => mutate()}
          emptyMessage="Nenhuma coleta registrada."
        />
      </EdocsPage>

      {confirming && (
        <SolicitarColetaDialog
          onClose={() => setConfirming(false)}
          onConfirm={async () => {
            try {
              const created = await solicitarColetaEdocs();
              setConfirming(false);
              await revalidateEdocsCaches(mutateCache);
              setFeedback({
                kind: created.situacao === "FALHOU" ? "error" : "success",
                message:
                  created.situacao === "FALHOU"
                    ? created.mensagem_erro || "A coleta foi registrada, mas a integração falhou."
                    : "Coleta concluída e dados administrativos revalidados.",
              });
            } catch (caught) {
              setFeedback({
                kind: "error",
                message: getApiErrorMessage(
                  caught,
                  "Não foi possível solicitar a coleta.",
                ),
              });
            }
          }}
        />
      )}
    </RouteGuard>
  );
}

function SolicitarColetaDialog({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  return (
    <EdocsModal title="Solicitar coleta E-Docs" onClose={onClose}>
      <p className="mt-3 text-sm text-slate-600">
        A consulta será executada pelo backend e persistirá a comparação,
        divergências e auditoria. O catálogo definitivo não será alterado
        automaticamente.
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            await onConfirm();
            setSaving(false);
          }}
        >
          {saving ? "Consultando..." : "Confirmar coleta"}
        </Button>
      </div>
    </EdocsModal>
  );
}
