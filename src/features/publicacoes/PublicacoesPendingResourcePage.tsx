"use client";

import { AdminLoading } from "@/components/admin/AdminLoading";
import { RouteGuard } from "@/components/common/RouteGuard";
import { UnderDevelopment } from "@/components/common/UnderDevelopment";
import type { PermissionKey } from "@/lib/permissions";

interface PublicacoesPendingResourcePageProps {
  title: string;
  description: string;
  permission: PermissionKey;
}

export function PublicacoesPendingResourcePage({
  title,
  description,
  permission,
}: PublicacoesPendingResourcePageProps) {
  return (
    <RouteGuard
      permission={permission}
      loadingFallback={<AdminLoading label={`Verificando acesso a ${title}...`} />}
    >
      <section className="w-full py-8" aria-labelledby="resource-title">
        <header className="mb-6">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-app-primary">
            Publicações Institucionais
          </p>
          <h1
            id="resource-title"
            className="text-2xl font-bold tracking-tight text-slate-900"
          >
            {title}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            {description}
          </p>
        </header>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <UnderDevelopment featureName={title}>
            <p className="max-w-lg text-sm text-slate-500">
              O contrato da API administrativa ainda não está disponível. Nenhum
              dado será apresentado até que o endpoint HTTP e seu payload sejam
              formalizados pelo backend.
            </p>
          </UnderDevelopment>
        </div>
      </section>
    </RouteGuard>
  );
}
