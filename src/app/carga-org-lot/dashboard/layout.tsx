// src/app/carga-org-lot/dashboard/layout.tsx
import AppShell from "@/components/layout/AppShell";

export default function CargaOrgLotDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell
      appContext="CARGA_ORG_LOT"
      title="Carga Org/Lot"
      titleMinor="SEGER/SUBGES/GPP"
    >
      {children}{" "}
    </AppShell>
  );
}
