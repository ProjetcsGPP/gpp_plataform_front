// src/app/acoes-pngi/dashboard/layout.tsx
import AppShell from "@/components/layout/AppShell";

export default function AcoesPngiDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell
      appContext="ACOES_PNGI"
      title="Ações PNGI"
      titleMinor="SEGER/SUBGES/GPP"
    >
      {children}{" "}
    </AppShell>
  );
}
