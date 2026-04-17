// Shell visual das rotas autenticadas do portal
// LoadingGuard + Sidebar + TopBar ficam aqui — nunca no portal/layout.tsx
import { LoadingGuard } from "@/components/common/LoadingGuard";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

export default function PortalDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LoadingGuard>
      <div className="min-h-screen flex bg-app-gradient">
        <Sidebar appContext="PORTAL" />
        <div className="flex flex-col flex-1 pl-18">
          <TopBar
            title="Portal de Aplicações"
            titleMinor="SEGER/SUBGES/GPP"
            appContext="PORTAL"
          />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </LoadingGuard>
  );
}
