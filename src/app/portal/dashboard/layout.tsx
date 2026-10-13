// src/app/portal/dashboard/layout.tsx
import AppShell from "@/components/layout/AppShell";

export default function PortalDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell
      appContext="PORTAL"
      title="Portal de Aplicações"
      titleMinor="SEGER/SUBGES/GPP"
    >
      {children}{" "}
    </AppShell>
  );
}
