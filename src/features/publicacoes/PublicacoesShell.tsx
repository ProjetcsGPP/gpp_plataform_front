import AppShell from "@/components/layout/AppShell";

export function PublicacoesShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      appContext="PUB_INSTITUCIONAL"
      title="Publicações Institucionais"
      titleMinor="SEGER/SUBGES/GPP"
    >
      {children}
    </AppShell>
  );
}
