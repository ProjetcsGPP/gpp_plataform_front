"use client";

import type { Key, ReactNode } from "react";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

import { AdminLoading } from "@/components/admin/AdminLoading";
import { AdminAlert, AdminPanel } from "@/components/admin/AdminPage";
import { AdminSortableHeader } from "@/components/admin/AdminSortableHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  AdminSortRule,
  AdminTableDensity,
} from "@/types/admin";

export interface AdminTableColumn<Row, SortKey extends string> {
  key: string;
  label: string;
  sortKey?: SortKey;
  render: (row: Row) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface AdminDataTableProps<Row, SortKey extends string> {
  rows: Row[];
  columns: AdminTableColumn<Row, SortKey>[];
  getRowKey: (row: Row) => Key;
  sorting: AdminSortRule<SortKey>[];
  onSort: (key: SortKey, additive: boolean) => void;
  page: number;
  pageSize: number;
  pageSizeOptions: readonly number[];
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  density: AdminTableDensity;
  onDensityChange: (density: AdminTableDensity) => void;
  onResetView: () => void;
  isLoading?: boolean;
  isRefreshing?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  emptyMessage?: string;
}

export function AdminDataTable<Row, SortKey extends string>({
  rows,
  columns,
  getRowKey,
  sorting,
  onSort,
  page,
  pageSize,
  pageSizeOptions,
  totalCount,
  hasPreviousPage,
  hasNextPage,
  onPageChange,
  onPageSizeChange,
  density,
  onDensityChange,
  onResetView,
  isLoading = false,
  isRefreshing = false,
  errorMessage = null,
  onRetry,
  emptyMessage = "Nenhum registro encontrado.",
}: AdminDataTableProps<Row, SortKey>) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const cellPadding = density === "compact" ? "py-2" : "py-3.5";
  const hasSortableColumns = columns.some((column) => column.sortKey);

  if (errorMessage) {
    return (
      <AdminAlert>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>{errorMessage}</span>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Tentar novamente
            </Button>
          )}
        </div>
      </AdminAlert>
    );
  }

  if (isLoading) return <AdminLoading />;

  return (
    <AdminPanel className="relative" aria-busy={isRefreshing}>
      {isRefreshing && (
        <div className="absolute inset-x-0 top-0 h-0.5 animate-pulse bg-app-primary" />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-2.5">
        <div className="text-xs text-slate-500">
          {!hasSortableColumns
            ? "Ordenação definida pelo sistema"
            : sorting.length > 1
              ? `${sorting.length} critérios de ordenação ativos`
              : "Use Shift+clique para combinar ordenações"}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={density === "compact" ? "secondary" : "ghost"}
            size="xs"
            onClick={() => onDensityChange("compact")}
            aria-pressed={density === "compact"}
          >
            Compacta
          </Button>
          <Button
            variant={density === "comfortable" ? "secondary" : "ghost"}
            size="xs"
            onClick={() => onDensityChange("comfortable")}
            aria-pressed={density === "comfortable"}
          >
            Confortável
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={onResetView}
            title="Restaurar visualização padrão"
          >
            <RotateCcw aria-hidden="true" /> Restaurar
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              {columns.map((column) =>
                column.sortKey ? (
                  <AdminSortableHeader
                    key={column.key}
                    field={column.sortKey}
                    label={column.label}
                    sorting={sorting}
                    onSort={onSort}
                    className={column.headerClassName}
                  />
                ) : (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn(
                      "px-5 py-2.5 font-semibold",
                      column.headerClassName,
                    )}
                  >
                    {column.label}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={getRowKey(row)} className="hover:bg-slate-50/80">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn("px-5", cellPadding, column.className)}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <div className="px-6 py-14 text-center text-sm text-slate-500">
          {emptyMessage}
        </div>
      )}

      <footer className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span>
            {totalCount} {totalCount === 1 ? "registro" : "registros"}
          </span>
          <label className="flex items-center gap-1.5">
            Por página
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="h-7 rounded-md border border-slate-300 bg-white px-2 text-xs outline-none focus:border-app-primary"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPreviousPage || isRefreshing}
            aria-label="Página anterior"
          >
            <ChevronLeft aria-hidden="true" /> Anterior
          </Button>
          <span className="min-w-24 text-center text-xs text-slate-600">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNextPage || isRefreshing}
            aria-label="Próxima página"
          >
            Próxima <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </footer>
    </AdminPanel>
  );
}
