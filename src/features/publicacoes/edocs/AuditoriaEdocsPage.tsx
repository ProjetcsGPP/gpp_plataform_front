"use client";

import { useState } from "react";
import useSWR from "swr";
import { Eye } from "lucide-react";

import { AdminDataTable, type AdminTableColumn } from "@/components/admin/AdminDataTable";
import { AdminLoading } from "@/components/admin/AdminLoading";
import { RouteGuard } from "@/components/common/RouteGuard";
import { Button } from "@/components/ui/button";
import { listAuditoriaEdocs } from "@/features/publicacoes/edocs/api";
import { edocsCacheKeys } from "@/features/publicacoes/edocs/cache";
import {
  EdocsFilters,
  EdocsJsonBlock,
  EdocsModal,
  EdocsPage,
  EdocsSelectFilter,
  EdocsTextFilter,
} from "@/features/publicacoes/edocs/EdocsUi";
import type { EventoAuditoriaPatriarcaEdocs } from "@/features/publicacoes/edocs/model";
import { edocsOrdering, nextEdocsSorting } from "@/features/publicacoes/edocs/table";
import { formatAdminDate } from "@/lib/adminResource";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { PERMISSIONS } from "@/lib/permissions";
import type { AdminSortRule, AdminTableDensity } from "@/types/admin";

type SortKey = "criado_em" | "tipo_evento";

export function AuditoriaEdocsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [eventType, setEventType] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [density, setDensity] = useState<AdminTableDensity>("compact");
  const [sorting, setSorting] = useState<AdminSortRule<SortKey>[]>([
    { key: "criado_em", direction: "desc" },
  ]);
  const [selected, setSelected] = useState<EventoAuditoriaPatriarcaEdocs | null>(null);
  const ordering = edocsOrdering(sorting);
  const key = edocsCacheKeys.auditoria([
    page,
    pageSize,
    eventType,
    collectionId,
    ordering,
  ]);
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    () =>
      listAuditoriaEdocs({
        page,
        page_size: pageSize,
        ordering,
        tipo_evento: eventType || undefined,
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

  const columns: AdminTableColumn<EventoAuditoriaPatriarcaEdocs, SortKey>[] = [
    {
      key: "data",
      label: "Data",
      sortKey: "criado_em",
      render: (row) => formatAdminDate(row.criado_em),
    },
    {
      key: "tipo",
      label: "Evento",
      sortKey: "tipo_evento",
      render: (row) => row.tipo_evento.replaceAll("_", " "),
    },
    {
      key: "mensagem",
      label: "Mensagem",
      render: (row) => <span className="block max-w-xl">{row.mensagem}</span>,
    },
    {
      key: "referencias",
      label: "Referências",
      render: (row) => (
        <div className="text-xs leading-5 text-slate-600">
          {row.coleta_id && <span className="block">Coleta {row.coleta_id}</span>}
          {row.patriarca_id && <span className="block">Patriarca #{row.patriarca_id}</span>}
          {row.divergencia_id && <span className="block">Divergência #{row.divergencia_id}</span>}
          {!row.coleta_id && !row.patriarca_id && !row.divergencia_id && "—"}
        </div>
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
        <Button variant="ghost" size="sm" onClick={() => setSelected(row)}>
          <Eye aria-hidden="true" /> Ver dados
        </Button>
      ),
    },
  ];

  return (
    <RouteGuard
      permission={PERMISSIONS.EDOCS_EVENTO_AUDITORIA_VIEW}
      loadingFallback={<AdminLoading label="Verificando acesso à auditoria..." />}
    >
      <EdocsPage
        title="Auditoria E-Docs"
        description="Trilha append-only das coletas, divergências e decisões do catálogo."
      >
        <EdocsFilters>
          <EdocsSelectFilter
            label="Tipo de evento"
            value={eventType}
            onChange={(value) => changeFilter(setEventType, value)}
          >
            <option value="">Todos</option>
            <option value="COLETA_INICIADA">Coleta iniciada</option>
            <option value="COLETA_CONCLUIDA">Coleta concluída</option>
            <option value="COLETA_FALHOU">Coleta falhou</option>
            <option value="DIVERGENCIA_DETECTADA">Divergência detectada</option>
            <option value="CATALOGO_INCLUIDO">Catálogo incluído</option>
            <option value="CATALOGO_ATUALIZADO">Catálogo atualizado</option>
            <option value="CATALOGO_DESATIVADO">Catálogo desativado</option>
            <option value="CATALOGO_MANTIDO">Catálogo mantido</option>
            <option value="SELECAO_COLETA_ALTERADA">Seleção de coleta alterada</option>
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
              ? getApiErrorMessage(error, "Não foi possível carregar a auditoria.")
              : null
          }
          onRetry={() => mutate()}
          emptyMessage="Nenhum evento de auditoria encontrado."
        />
      </EdocsPage>

      {selected && (
        <EdocsModal
          title={`Evento de auditoria #${selected.id}`}
          onClose={() => setSelected(null)}
          wide
        >
          <p className="mt-3 text-sm text-slate-700">{selected.mensagem}</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <EdocsJsonBlock title="Dados anteriores" value={selected.dados_anteriores} />
            <EdocsJsonBlock title="Dados atuais" value={selected.dados_atuais} />
          </div>
          <div className="mt-4">
            <EdocsJsonBlock title="Metadados" value={selected.metadados} />
          </div>
          <div className="mt-5 flex justify-end">
            <Button variant="outline" onClick={() => setSelected(null)}>
              Fechar
            </Button>
          </div>
        </EdocsModal>
      )}
    </RouteGuard>
  );
}
