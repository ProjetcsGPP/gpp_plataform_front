"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { ListChecks } from "lucide-react";

import { AdminDataTable, type AdminTableColumn } from "@/components/admin/AdminDataTable";
import { AdminAlert } from "@/components/admin/AdminPage";
import { AdminLoading } from "@/components/admin/AdminLoading";
import { RouteGuard } from "@/components/common/RouteGuard";
import { Button } from "@/components/ui/button";
import { alterarSelecaoColetaEdocs, listPatriarcasEdocs } from "@/features/publicacoes/edocs/api";
import { EDOCS_ACTIONS, hasEdocsAction } from "@/features/publicacoes/edocs/actions";
import { edocsCacheKeys, revalidateEdocsCaches } from "@/features/publicacoes/edocs/cache";
import {
  EdocsFilters,
  EdocsModal,
  EdocsPage,
  EdocsSelectFilter,
  EdocsStatusBadge,
  EdocsTextFilter,
} from "@/features/publicacoes/edocs/EdocsUi";
import type { PatriarcaEdocs } from "@/features/publicacoes/edocs/model";
import { edocsOrdering, nextEdocsSorting } from "@/features/publicacoes/edocs/table";
import { usePermissions } from "@/hooks/usePermissions";
import { formatAdminDate } from "@/lib/adminResource";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { PERMISSIONS } from "@/lib/permissions";
import type { AdminSortRule, AdminTableDensity } from "@/types/admin";

type SortKey = "nome" | "sigla" | "ativo" | "coletar_detalhes" | "atualizado_em";

export function PatriarcasEdocsPage() {
  const { can } = usePermissions();
  const { mutate: mutateCache } = useSWRConfig();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("");
  const [collectDetails, setCollectDetails] = useState("");
  const [density, setDensity] = useState<AdminTableDensity>("compact");
  const [sorting, setSorting] = useState<AdminSortRule<SortKey>[]>([
    { key: "nome", direction: "asc" },
  ]);
  const [selected, setSelected] = useState<PatriarcaEdocs | null>(null);
  const [feedback, setFeedback] = useState<{
    kind: "error" | "success";
    message: string;
  } | null>(null);
  const ordering = edocsOrdering(sorting);
  const key = edocsCacheKeys.patriarcas([
    page,
    pageSize,
    search,
    active,
    collectDetails,
    ordering,
  ]);
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    () =>
      listPatriarcasEdocs({
        page,
        page_size: pageSize,
        ordering,
        search: search.trim() || undefined,
        ativo: active ? active === "true" : undefined,
        coletar_detalhes: collectDetails
          ? collectDetails === "true"
          : undefined,
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

  const columns: AdminTableColumn<PatriarcaEdocs, SortKey>[] = [
    {
      key: "sigla",
      label: "Sigla",
      sortKey: "sigla",
      className: "font-semibold",
      render: (row) => row.sigla || "—",
    },
    {
      key: "nome",
      label: "Nome",
      sortKey: "nome",
      render: (row) => (
        <div>
          <span className="font-medium">{row.nome}</span>
          <span className="block text-xs text-slate-500">{row.id_externo}</span>
        </div>
      ),
    },
    {
      key: "tipo",
      label: "Tipo",
      render: (row) => row.descricao_tipo_agente,
    },
    {
      key: "coleta",
      label: "Coleta detalhada",
      sortKey: "coletar_detalhes",
      render: (row) => (
        <EdocsStatusBadge positive={row.coletar_detalhes}>
          {row.coletar_detalhes ? "Selecionado" : "Não selecionado"}
        </EdocsStatusBadge>
      ),
    },
    {
      key: "situacao",
      label: "Situação",
      sortKey: "ativo",
      render: (row) => (
        <EdocsStatusBadge positive={row.ativo} negative={!row.ativo}>
          {row.ativo ? "Ativo" : "Inativo"}
        </EdocsStatusBadge>
      ),
    },
    {
      key: "atualizado",
      label: "Atualizado em",
      sortKey: "atualizado_em",
      render: (row) => formatAdminDate(row.atualizado_em),
    },
    {
      key: "acoes",
      label: "Ações",
      headerClassName: "text-right",
      className: "text-right",
      render: (row) =>
        can(PERMISSIONS.EDOCS_PATRIARCA_SELECIONAR_COLETA) &&
        hasEdocsAction(
          row.acoes_disponiveis,
          EDOCS_ACTIONS.ALTERAR_SELECAO_COLETA,
        ) ? (
          <Button variant="outline" size="sm" onClick={() => setSelected(row)}>
            <ListChecks aria-hidden="true" /> Alterar seleção
          </Button>
        ) : (
          <span className="text-xs text-slate-400">Sem ações</span>
        ),
    },
  ];

  return (
    <RouteGuard
      permission={PERMISSIONS.EDOCS_PATRIARCA_VIEW}
      loadingFallback={<AdminLoading label="Verificando acesso ao catálogo..." />}
    >
      <EdocsPage
        title="Patriarcas E-Docs"
        description="Catálogo definitivo de patriarcas e seleção para coletas detalhadas."
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
          <EdocsTextFilter
            label="Pesquisar"
            value={search}
            placeholder="Nome, sigla ou ID externo"
            onChange={(value) => changeFilter(setSearch, value)}
          />
          <EdocsSelectFilter
            label="Situação"
            value={active}
            onChange={(value) => changeFilter(setActive, value)}
          >
            <option value="">Todas</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </EdocsSelectFilter>
          <EdocsSelectFilter
            label="Coleta detalhada"
            value={collectDetails}
            onChange={(value) => changeFilter(setCollectDetails, value)}
          >
            <option value="">Todos</option>
            <option value="true">Selecionados</option>
            <option value="false">Não selecionados</option>
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
            setSorting([{ key: "nome", direction: "asc" }]);
            setDensity("compact");
          }}
          isLoading={isLoading}
          isRefreshing={isValidating && Boolean(data)}
          errorMessage={
            error
              ? getApiErrorMessage(error, "Não foi possível carregar o catálogo.")
              : null
          }
          onRetry={() => mutate()}
          emptyMessage="Nenhum patriarca encontrado."
        />
      </EdocsPage>

      {selected && (
        <SelecaoColetaDialog
          patriarca={selected}
          onClose={() => setSelected(null)}
          onSave={async (justificativa) => {
            try {
              await alterarSelecaoColetaEdocs(selected.id, {
                coletar_detalhes: !selected.coletar_detalhes,
                justificativa,
              });
              setSelected(null);
              await revalidateEdocsCaches(mutateCache);
              setFeedback({
                kind: "success",
                message: "Seleção para coleta atualizada e registrada na auditoria.",
              });
            } catch (caught) {
              setFeedback({
                kind: "error",
                message: getApiErrorMessage(
                  caught,
                  "Não foi possível alterar a seleção para coleta.",
                ),
              });
            }
          }}
        />
      )}
    </RouteGuard>
  );
}

function SelecaoColetaDialog({
  patriarca,
  onClose,
  onSave,
}: {
  patriarca: PatriarcaEdocs;
  onClose: () => void;
  onSave: (justificativa: string) => Promise<void>;
}) {
  const [justification, setJustification] = useState("");
  const [saving, setSaving] = useState(false);
  const selecting = !patriarca.coletar_detalhes;

  return (
    <EdocsModal title="Alterar seleção para coleta" onClose={onClose}>
      <p className="mt-3 text-sm text-slate-600">
        {selecting ? "Selecionar" : "Remover"} <strong>{patriarca.nome}</strong>{" "}
        {selecting ? "para" : "das"} coletas detalhadas.
      </p>
      <label className="mt-4 block text-xs font-medium text-slate-600">
        Justificativa
        <textarea
          className="mt-1 block w-full rounded-md border border-slate-300 p-3 text-sm"
          rows={4}
          value={justification}
          onChange={(event) => setJustification(event.target.value)}
        />
      </label>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          disabled={!justification.trim() || saving}
          onClick={async () => {
            setSaving(true);
            await onSave(justification.trim());
            setSaving(false);
          }}
        >
          {saving ? "Salvando..." : "Confirmar alteração"}
        </Button>
      </div>
    </EdocsModal>
  );
}
