"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

import {
  AdminDataTable,
  type AdminTableColumn,
} from "@/components/admin/AdminDataTable";
import { AdminPage } from "@/components/admin/AdminPage";
import { Button } from "@/components/ui/button";
import { useAdminListState } from "@/hooks/useAdminListState";
import { useAdminResourceList as useResourceList } from "@/hooks/useAdminResource";
import { usePermissions } from "@/hooks/usePermissions";
import { formatAdminDate } from "@/lib/adminResource";
import { getApiErrorMessage } from "@/lib/apiErrors";
import type {
  AdminAuditRecord,
  AdminResourceDefinition,
} from "@/types/adminResource";

interface AdminResourceListProps<
  Row extends AdminAuditRecord,
  Payload,
  FormValues extends object,
  SortKey extends string,
> {
  resource: AdminResourceDefinition<Row, Payload, FormValues, SortKey>;
}

export function AdminResourceList<
  Row extends AdminAuditRecord,
  Payload,
  FormValues extends object,
  SortKey extends string,
>({ resource }: AdminResourceListProps<Row, Payload, FormValues, SortKey>) {
  const listState = useAdminListState({
    sortKeys: resource.sortKeys,
    defaults: resource.defaultPreferences,
  });
  const { data, error, isLoading, isValidating, mutate } = useResourceList(
    resource,
    listState.query,
  );
  const { can } = usePermissions();
  const canAdd = can(resource.permissions.add);
  const canChange = can(resource.permissions.change);

  const columns = useMemo<AdminTableColumn<Row, SortKey>[]>(() => {
    const configured: AdminTableColumn<Row, SortKey>[] = resource.columns.map(
      (column) => ({ ...column }),
    );

    if (resource.auditColumns) {
      configured.push(
        {
          key: "updatedBy",
          label: "Atualizado por",
          sortKey: resource.auditColumns.updatedBy,
          className: "text-slate-600",
          render: (row) => row.updated_by_name || "—",
        },
        {
          key: "updatedAt",
          label: "Atualizado em",
          sortKey: resource.auditColumns.updatedAt,
          className: "whitespace-nowrap text-slate-600",
          render: (row) => formatAdminDate(row.updated_at),
        },
      );
    }

    if (canChange) {
      configured.push({
        key: "actions",
        label: "Ações",
        className: "text-right",
        headerClassName: "text-right",
        render: (row) => (
          <Button
            variant="ghost"
            size="sm"
            className="table-action-button"
            asChild
          >
            <Link href={`${resource.basePath}/${resource.getId(row)}/editar`}>
              <Pencil aria-hidden="true" /> Editar
            </Link>
          </Button>
        ),
      });
    }

    return configured;
  }, [canChange, resource]);

  return (
    <AdminPage
      title={resource.texts.listTitle}
      description={resource.texts.listDescription}
      actions={
        canAdd ? (
          <Button
            asChild
            className="bg-app-primary text-app-primary-text hover:bg-app-primary-hover"
          >
            <Link href={`${resource.basePath}/novo`}>
              <Plus aria-hidden="true" /> {resource.texts.createAction}
            </Link>
          </Button>
        ) : undefined
      }
    >
      <AdminDataTable<Row, SortKey>
        rows={data?.results ?? []}
        columns={columns}
        getRowKey={resource.getId}
        sorting={listState.query.sorting}
        onSort={listState.toggleSorting}
        page={listState.query.page}
        pageSize={listState.query.pageSize}
        pageSizeOptions={listState.pageSizeOptions}
        totalCount={data?.count ?? 0}
        hasPreviousPage={Boolean(data?.previous)}
        hasNextPage={Boolean(data?.next)}
        onPageChange={listState.setPage}
        onPageSizeChange={listState.setPageSize}
        density={listState.density}
        onDensityChange={listState.setDensity}
        onResetView={listState.resetView}
        isLoading={isLoading}
        isRefreshing={isValidating && Boolean(data)}
        errorMessage={
          error ? getApiErrorMessage(error, resource.texts.listError) : null
        }
        onRetry={() => mutate()}
        emptyMessage={resource.texts.empty}
      />
    </AdminPage>
  );
}
