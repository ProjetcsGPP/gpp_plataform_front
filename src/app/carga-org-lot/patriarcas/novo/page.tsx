"use client";

import { AdminPage } from "@/components/admin/AdminPage";
import { RouteGuard } from "@/components/common/RouteGuard";
import { PatriarcaForm } from "@/features/carga-org-lot/PatriarcaForm";
import { PERMISSIONS } from "@/lib/permissions";

export default function Page() {
  return <RouteGuard permission={PERMISSIONS.PATRIARCA_ADD}>
    <AdminPage title="Novo patriarca" description="Informe os dados da organização de referência."><PatriarcaForm /></AdminPage>
  </RouteGuard>;
}
