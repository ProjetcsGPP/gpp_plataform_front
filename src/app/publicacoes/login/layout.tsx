import TopBarNoLogin from "@/components/layout/TopBarNoLogin";

export default function PublicacoesLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      data-app="PUB_INSTITUCIONAL"
      className="flex min-h-screen flex-col bg-app-gradient"
    >
      <TopBarNoLogin
        title="Publicações Institucionais"
        titleMinor="SEGER/SUBGES/GPP"
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
