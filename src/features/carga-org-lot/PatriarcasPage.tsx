"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Check, Pencil, Plus } from "lucide-react";

import { AdminDataTable, type AdminTableColumn } from "@/components/admin/AdminDataTable";
import { AdminPage } from "@/components/admin/AdminPage";
import { RouteGuard } from "@/components/common/RouteGuard";
import { Button } from "@/components/ui/button";
import { listPatriarcas } from "@/features/carga-org-lot/api";
import type { Patriarca } from "@/features/carga-org-lot/model";
import { usePatriarcaSelection } from "@/features/carga-org-lot/usePatriarcaSelection";
import { usePermissions } from "@/hooks/usePermissions";
import { formatAdminDate } from "@/lib/adminResource";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { PERMISSIONS } from "@/lib/permissions";
import type { AdminSortRule, AdminTableDensity } from "@/types/admin";

type SortKey = "strsiglapatriarca" | "strnome" | "datcriacao" | "datalteracao" | "idpatriarca";
const orderingName = (sorting: AdminSortRule<SortKey>[]) => sorting.map(({ key, direction }) => `${direction === "desc" ? "-" : ""}${key}`).join(",");

export function PatriarcasPage() {
  const { can } = usePermissions();
  const { selected, select } = usePatriarcaSelection();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [density, setDensity] = useState<AdminTableDensity>("compact");
  const [sorting, setSorting] = useState<AdminSortRule<SortKey>[]>([
    { key: "strsiglapatriarca", direction: "asc" },
    { key: "idpatriarca", direction: "asc" },
  ]);
  const key = ["carga-org-lot:patriarcas", page, pageSize, orderingName(sorting)] as const;
  const { data, error, isLoading, isValidating, mutate } = useSWR(key, () =>
    listPatriarcas({ page, page_size: pageSize, ordering: orderingName(sorting) }),
  );

  function toggleSort(sortKey: SortKey, additive: boolean) {
    setPage(1);
    setSorting((current) => {
      const found = current.find((rule) => rule.key === sortKey);
      const next = found?.direction === "asc" ? "desc" : "asc";
      if (!additive) return [{ key: sortKey, direction: next }];
      return [...current.filter((rule) => rule.key !== sortKey), { key: sortKey, direction: next }];
    });
  }

  const columns: AdminTableColumn<Patriarca, SortKey>[] = [
    { key: "sigla", label: "Sigla", sortKey: "strsiglapatriarca", className: "font-semibold", render: (row) => row.strsiglapatriarca },
    { key: "nome", label: "Nome", sortKey: "strnome", render: (row) => row.strnome },
    { key: "status", label: "Status", render: (row) => row.status?.strdescricao ?? "—" },
    { key: "criacao", label: "Criado em", sortKey: "datcriacao", render: (row) => formatAdminDate(row.datcriacao) },
    { key: "acoes", label: "Ações", headerClassName: "text-right", className: "text-right", render: (row) => <div className="flex justify-end gap-1">
      <Button
        variant={selected?.idpatriarca === row.idpatriarca ? "secondary" : "outline"}
        size="sm"
        className="table-action-button"
        disabled={selected?.idpatriarca === row.idpatriarca}
        onClick={() => select(row)}
      >
        {selected?.idpatriarca === row.idpatriarca && <Check />}
        {selected?.idpatriarca === row.idpatriarca ? "Selecionado" : "Selecionar"}
      </Button>
      {selected?.idpatriarca === row.idpatriarca && can(PERMISSIONS.PATRIARCA_CHANGE) && <Button variant="ghost" size="sm" className="table-action-button" asChild><Link href={`/carga-org-lot/patriarcas/${row.idpatriarca}/editar`}><Pencil /> Editar</Link></Button>}
    </div> },
  ];

  return <RouteGuard permission={PERMISSIONS.PATRIARCA_VIEW}>
    <AdminPage title="Patriarcas" description="Escolha uma organização para trabalhar ou cadastre um novo patriarca."
      actions={selected && can(PERMISSIONS.PATRIARCA_ADD) ? <Button asChild><Link href="/carga-org-lot/patriarcas/novo"><Plus /> Novo patriarca</Link></Button> : undefined}>
      <AdminDataTable rows={data?.results ?? []} columns={columns} getRowKey={(row) => row.idpatriarca}
        sorting={sorting} onSort={toggleSort} page={page} pageSize={pageSize} pageSizeOptions={[10, 20, 50]}
        totalCount={data?.count ?? 0} hasPreviousPage={Boolean(data?.previous)} hasNextPage={Boolean(data?.next)}
        onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} density={density}
        onDensityChange={setDensity} onResetView={() => { setSorting([{ key: "strsiglapatriarca", direction: "asc" }, { key: "idpatriarca", direction: "asc" }]); setDensity("compact"); }}
        isLoading={isLoading} isRefreshing={isValidating && Boolean(data)}
        errorMessage={error ? getApiErrorMessage(error, "Não foi possível carregar os patriarcas.") : null}
        onRetry={() => mutate()} emptyMessage="Nenhum patriarca cadastrado." />
    </AdminPage>
  </RouteGuard>;
}
