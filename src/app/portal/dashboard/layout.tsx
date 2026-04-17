// src/app/portal/dashboard/layout.tsx
import { AppThemeProvider } from "@/components/common/AppThemeProvider";
import { LoadingGuard } from "@/components/common/LoadingGuard";
import TopBar from "@/components/layout/TopBar";
import Sidebar from "@/components/layout/Sidebar";

export default function PortalDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppThemeProvider appContext="PORTAL">
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
    </AppThemeProvider>
  );
}
