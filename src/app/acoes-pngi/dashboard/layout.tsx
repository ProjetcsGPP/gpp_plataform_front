// src/app/acoes-pngi/dashboard/layout.tsx
import { AppThemeProvider } from "@/components/common/AppThemeProvider";
import { LoadingGuard } from "@/components/common/LoadingGuard";
import TopBar from "@/components/layout/TopBar";
import Sidebar from "@/components/layout/Sidebar";

export default function AcoesPngiDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppThemeProvider appContext="ACOES_PNGI">
      <LoadingGuard>
        <div className="min-h-screen flex bg-app-gradient">
          <Sidebar appContext="ACOES_PNGI" />
          <div className="flex flex-col flex-1 pl-18">
            <TopBar
              title="Ações PNGI"
              titleMinor="SEGER/SUBGES/GPP"
              appContext="ACOES_PNGI"
            />
            <main className="flex-1">{children}</main>
          </div>
        </div>
      </LoadingGuard>
    </AppThemeProvider>
  );
}
