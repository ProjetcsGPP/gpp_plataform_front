// src/app/carga-org-lot/dashboard/page.tsx
"use client";

import { AdminPage } from "@/components/admin/AdminPage";
import { CargaOrgLotProdestDashboard } from "@/features/carga-org-lot/CargaOrgLotProdestDashboard";

export default function CargaOrgLotDashboard() {
  return (
    <AdminPage title="Visão geral" description="Acompanhe os envios de organogramas em andamento e os resultados do dia.">
      <CargaOrgLotProdestDashboard />
    </AdminPage>
  );
}
