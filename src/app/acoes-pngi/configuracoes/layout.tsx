import AppShell from "@/components/layout/AppShell";

export default function AcoesPngiSettingsLayout({
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
      {children}
    </AppShell>
  );
}
