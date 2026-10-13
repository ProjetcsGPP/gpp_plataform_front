"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { AdminLoading } from "@/components/admin/AdminLoading";
import { AdminAlert, AdminPage } from "@/components/admin/AdminPage";
import { AdminResourceForm } from "@/components/admin/AdminResourceForm";
import { AdminResourceList } from "@/components/admin/AdminResourceList";
import { RouteGuard } from "@/components/common/RouteGuard";
import { Button } from "@/components/ui/button";
import { useAdminResourceDetail } from "@/hooks/useAdminResource";
import { getApiErrorMessage } from "@/lib/apiErrors";
import type {
  AdminAuditRecord,
  AdminResourceDefinition,
} from "@/types/adminResource";

interface ResourcePageProps<
  Row extends AdminAuditRecord,
  Payload,
  FormValues extends object,
  SortKey extends string,
> {
  resource: AdminResourceDefinition<Row, Payload, FormValues, SortKey>;
}

export function AdminResourceListPage<
  Row extends AdminAuditRecord,
  Payload,
  FormValues extends object,
  SortKey extends string,
>({ resource }: ResourcePageProps<Row, Payload, FormValues, SortKey>) {
  return (
    <RouteGuard
      permission={resource.permissions.view}
      loadingFallback={<AdminLoading />}
    >
      <Suspense fallback={<AdminLoading label="Carregando visualização..." />}>
        <AdminResourceList resource={resource} />
      </Suspense>
    </RouteGuard>
  );
}

export function AdminResourceCreatePage<
  Row extends AdminAuditRecord,
  Payload,
  FormValues extends object,
  SortKey extends string,
>({ resource }: ResourcePageProps<Row, Payload, FormValues, SortKey>) {
  return (
    <RouteGuard
      permission={resource.permissions.add}
      loadingFallback={<AdminLoading />}
    >
      <AdminPage
        title={resource.texts.createTitle}
        description={resource.texts.createDescription}
      >
        <AdminResourceForm resource={resource} />
      </AdminPage>
    </RouteGuard>
  );
}

interface EditResourcePageProps<
  Row extends AdminAuditRecord,
  Payload,
  FormValues extends object,
  SortKey extends string,
> extends ResourcePageProps<Row, Payload, FormValues, SortKey> {
  idParam: string;
}

function AdminResourceEditContent<
  Row extends AdminAuditRecord,
  Payload,
  FormValues extends object,
  SortKey extends string,
>({
  resource,
  idParam,
}: EditResourcePageProps<Row, Payload, FormValues, SortKey>) {
  const params = useParams<Record<string, string | string[]>>();
  const rawId = params[idParam];
  const parsedId = typeof rawId === "string" ? Number(rawId) : Number.NaN;
  const id = Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null;
  const { data, error, isLoading, isValidating, mutate } =
    useAdminResourceDetail(resource, id);

  if (id === null) {
    return (
      <AdminPage title={resource.texts.editTitle} description="Registro inválido.">
        <AdminAlert>O identificador informado não é válido.</AdminAlert>
      </AdminPage>
    );
  }

  if (isLoading || isValidating) {
    return <AdminLoading label={resource.texts.loading} />;
  }

  if (error || !data) {
    return (
      <AdminPage
        title={resource.texts.editTitle}
        description="Não foi possível abrir o registro."
      >
        <AdminAlert>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{getApiErrorMessage(error, resource.texts.notFound)}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => mutate()}>
                Tentar novamente
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={resource.basePath}>Voltar</Link>
              </Button>
            </div>
          </div>
        </AdminAlert>
      </AdminPage>
    );
  }

  return (
    <AdminPage
      title={resource.texts.editTitle}
      description={resource.texts.editDescription(data)}
    >
      <AdminResourceForm key={id} resource={resource} record={data} />
    </AdminPage>
  );
}

export function AdminResourceEditPage<
  Row extends AdminAuditRecord,
  Payload,
  FormValues extends object,
  SortKey extends string,
>({
  resource,
  idParam,
}: EditResourcePageProps<Row, Payload, FormValues, SortKey>) {
  return (
    <RouteGuard
      permission={resource.permissions.change}
      loadingFallback={<AdminLoading />}
    >
      <AdminResourceEditContent resource={resource} idParam={idParam} />
    </RouteGuard>
  );
}
