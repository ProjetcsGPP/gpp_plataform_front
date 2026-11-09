"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Eye, Scale } from "lucide-react";

import { AdminDataTable, type AdminTableColumn } from "@/components/admin/AdminDataTable";
import { AdminAlert } from "@/components/admin/AdminPage";
import { AdminLoading } from "@/components/admin/AdminLoading";
import { RouteGuard } from "@/components/common/RouteGuard";
import { Button } from "@/components/ui/button";
import { decidirDivergenciaEdocs, listDivergenciasEdocs } from "@/features/publicacoes/edocs/api";
import { EDOCS_ACTIONS, hasEdocsAction } from "@/features/publicacoes/edocs/actions";
import { edocsCacheKeys, revalidateEdocsCaches } from "@/features/publicacoes/edocs/cache";
import {
  EdocsFilters,
  EdocsJsonBlock,
  EdocsModal,
  EdocsPage,
  EdocsSelectFilter,
  EdocsStatusBadge,
  EdocsTextFilter,
} from "@/features/publicacoes/edocs/EdocsUi";
import type { DivergenciaPatriarcaEdocs } from "@/features/publicacoes/edocs/model";
import { edocsOrdering, nextEdocsSorting } from "@/features/publicacoes/edocs/table";
import { usePermissions } from "@/hooks/usePermissions";
import { formatAdminDate } from "@/lib/adminResource";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { PERMISSIONS } from "@/lib/permissions";
import type { AdminSortRule, AdminTableDensity } from "@/types/admin";

type SortKey = "criado_em" | "situacao" | "comparacao";

export function DivergenciasEdocsPage() {
  const { can } = usePermissions();
  const { mutate: mutateCache } = useSWRConfig();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState("");
  const [comparison, setComparison] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [density, setDensity] = useState<AdminTableDensity>("compact");
  const [sorting, setSorting] = useState<AdminSortRule<SortKey>[]>([
    { key: "criado_em", direction: "desc" },
  ]);
  const [selected, setSelected] = useState<DivergenciaPatriarcaEdocs | null>(null);
  const [feedback, setFeedback] = useState<{
    kind: "error" | "success";
    message: string;
  } | null>(null);
  const ordering = edocsOrdering(sorting);
  const key = edocsCacheKeys.divergencias([
    page,
    pageSize,
    status,
    comparison,
    collectionId,
    ordering,
  ]);
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    () =>
      listDivergenciasEdocs({
        page,
        page_size: pageSize,
        ordering,
        situacao: status || undefined,
        comparacao: comparison || undefined,
        coleta_id: collectionId.trim() || undefined,
      }),
    { keepPreviousData: true, revalidateOnFocus: false },
  );

  function changeFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  function toggleSort(sortKey: SortKey, additive: boolean) {
    setPage(1);
    setSorting((current) => nextEdocsSorting(current, sortKey, additive));
  }

  const columns: AdminTableColumn<DivergenciaPatriarcaEdocs, SortKey>[] = [
    {
      key: "criada",
      label: "Detectada em",
      sortKey: "criado_em",
      render: (row) => formatAdminDate(row.criado_em),
    },
    {
      key: "id_externo",
      label: "ID externo",
      render: (row) => (
        <div>
          <span className="font-medium">{row.id_externo}</span>
          <span className="block text-xs text-slate-500">
            Patriarca {row.patriarca_id ?? "a incluir"}
          </span>
        </div>
      ),
    },
    {
      key: "comparacao",
      label: "Comparação",
      sortKey: "comparacao",
      render: (row) => row.comparacao.replaceAll("_", " "),
    },
    {
      key: "campos",
      label: "Campos alterados",
      render: (row) => row.campos_alterados.join(", ") || "—",
    },
    {
      key: "situacao",
      label: "Situação",
      sortKey: "situacao",
      render: (row) => (
        <EdocsStatusBadge
          positive={row.situacao === "APLICADA" || row.situacao === "MANTIDA"}
        >
          {row.situacao.replaceAll("_", " ")}
        </EdocsStatusBadge>
      ),
    },
    {
      key: "acoes",
      label: "Ações",
      headerClassName: "text-right",
      className: "text-right",
      render: (row) => {
        const canDecide =
          can(PERMISSIONS.EDOCS_PATRIARCA_REVISAR) &&
          hasEdocsAction(row.acoes_disponiveis, EDOCS_ACTIONS.DECIDIR) &&
          row.decisoes_permitidas.length > 0;
        return (
          <Button
            variant={canDecide ? "outline" : "ghost"}
            size="sm"
            onClick={() => setSelected(row)}
          >
            {canDecide ? <Scale aria-hidden="true" /> : <Eye aria-hidden="true" />}
            {canDecide ? "Revisar" : "Ver evidências"}
          </Button>
        );
      },
    },
  ];

  return (
    <RouteGuard
      permission={PERMISSIONS.EDOCS_DIVERGENCIA_VIEW}
      loadingFallback={<AdminLoading label="Verificando acesso às divergências..." />}
    >
      <EdocsPage
        title="Divergências E-Docs"
        description="Evidências detectadas nas comparações e decisões explícitas sobre o catálogo definitivo."
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
            onChange={(value) => changeFilter(setStatus, value)}
          >
            <option value="">Todas</option>
            <option value="PENDENTE">Pendente</option>
            <option value="APLICADA">Aplicada</option>
            <option value="MANTIDA">Cadastro mantido</option>
            <option value="SUBSTITUIDA">Substituída</option>
          </EdocsSelectFilter>
          <EdocsSelectFilter
            label="Comparação"
            value={comparison}
            onChange={(value) => changeFilter(setComparison, value)}
          >
            <option value="">Todas</option>
            <option value="NOVO">Novo</option>
            <option value="ALTERADO">Alterado</option>
            <option value="AUSENTE">Ausente</option>
          </EdocsSelectFilter>
          <EdocsTextFilter
            label="ID da coleta"
            value={collectionId}
            placeholder="UUID"
            onChange={(value) => changeFilter(setCollectionId, value)}
          />
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
            setSorting([{ key: "criado_em", direction: "desc" }]);
            setDensity("compact");
          }}
          isLoading={isLoading}
          isRefreshing={isValidating && Boolean(data)}
          errorMessage={
            error
              ? getApiErrorMessage(error, "Não foi possível carregar as divergências.")
              : null
          }
          onRetry={() => mutate()}
          emptyMessage="Nenhuma divergência encontrada."
        />
      </EdocsPage>

      {selected && (
        <DivergenciaDialog
          divergence={selected}
          canDecide={
            can(PERMISSIONS.EDOCS_PATRIARCA_REVISAR) &&
            hasEdocsAction(selected.acoes_disponiveis, EDOCS_ACTIONS.DECIDIR)
          }
          onClose={() => setSelected(null)}
          onDecide={async (decision, justification, collectDetails) => {
            try {
              await decidirDivergenciaEdocs(selected.id, {
                decisao: decision,
                justificativa: justification,
                coletar_detalhes: collectDetails,
              });
              setSelected(null);
              await revalidateEdocsCaches(mutateCache);
              setFeedback({
                kind: "success",
                message: "Decisão aplicada e dados administrativos revalidados.",
              });
            } catch (caught) {
              setFeedback({
                kind: "error",
                message: getApiErrorMessage(
                  caught,
                  "Não foi possível aplicar a decisão.",
                ),
              });
            }
          }}
        />
      )}
    </RouteGuard>
  );
}

export function DivergenciaDialog({
  divergence,
  canDecide,
  onClose,
  onDecide,
}: {
  divergence: DivergenciaPatriarcaEdocs;
  canDecide: boolean;
  onClose: () => void;
  onDecide: (
    decision: string,
    justification: string,
    collectDetails: boolean,
  ) => Promise<void>;
}) {
  const [decision, setDecision] = useState("");
  const [justification, setJustification] = useState("");
  const [collectDetails, setCollectDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const actionAvailable = canDecide && divergence.decisoes_permitidas.length > 0;

  return (
    <EdocsModal title={`Divergência #${divergence.id}`} onClose={onClose} wide>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <EdocsJsonBlock title="Dados esperados" value={divergence.dados_esperados} />
        <EdocsJsonBlock title="Dados observados" value={divergence.dados_observados} />
      </div>
      {divergence.decisao && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
          <strong>Decisão: {divergence.decisao}</strong>
          <p className="mt-1 text-slate-600">{divergence.justificativa}</p>
          <p className="mt-1 text-xs text-slate-500">
            {divergence.revisado_por_nome || "Responsável não informado"} ·{" "}
            {divergence.revisado_em ? formatAdminDate(divergence.revisado_em) : "—"}
          </p>
        </div>
      )}
      {actionAvailable && (
        <div className="mt-5 border-t border-slate-200 pt-4">
          <label className="block text-xs font-medium text-slate-600">
            Decisão
            <select
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              value={decision}
              onChange={(event) => setDecision(event.target.value)}
            >
              <option value="">Selecione uma decisão permitida</option>
              {divergence.decisoes_permitidas.map((allowedDecision) => (
                <option key={allowedDecision} value={allowedDecision}>
                  {allowedDecision.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-3 block text-xs font-medium text-slate-600">
            Justificativa
            <textarea
              className="mt-1 block w-full rounded-md border border-slate-300 p-3 text-sm"
              rows={4}
              value={justification}
              onChange={(event) => setJustification(event.target.value)}
            />
          </label>
          <label className="mt-3 flex items-start gap-2 text-sm text-slate-700">
            <input
              className="mt-1"
              type="checkbox"
              checked={collectDetails}
              onChange={(event) => setCollectDetails(event.target.checked)}
            />
            Coletar informações detalhadas deste patriarca
          </label>
        </div>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Fechar
        </Button>
        {actionAvailable && (
          <Button
            disabled={!decision || !justification.trim() || saving}
            onClick={async () => {
              setSaving(true);
              await onDecide(decision, justification.trim(), collectDetails);
              setSaving(false);
            }}
          >
            {saving ? "Aplicando..." : "Aplicar decisão"}
          </Button>
        )}
      </div>
    </EdocsModal>
  );
}
