// src/app/carga-org-lot/dashboard/layout.tsx
import { CargaOrgLotShell } from "@/features/carga-org-lot/CargaOrgLotShell";

export default function CargaOrgLotDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CargaOrgLotShell>{children}</CargaOrgLotShell>
  );
}
