// src/app/carga-org-lot/dashboard/layout.tsx
import { AppThemeProvider } from "@/components/common/AppThemeProvider";
import { AuthHydrator }     from "@/components/common/AuthHydrator";
import { LoadingGuard }     from "@/components/common/LoadingGuard";
import TopBar               from "@/components/layout/TopBar";
import Sidebar              from "@/components/layout/Sidebar";

export default function CargaOrgLotDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppThemeProvider appContext="CARGA_ORG_LOT">
      <AuthHydrator />
      <LoadingGuard>
        <div className="min-h-screen flex bg-app-gradient">
          <Sidebar appContext="CARGA_ORG_LOT" />
          <div className="flex flex-col flex-1 pl-18">
            <TopBar
              title="Carga Org/Lot"
              titleMinor="SEGER/SUBGES/GPP"
              appContext="CARGA_ORG_LOT"
            />
            <main className="flex-1">{children}</main>
          </div>
        </div>
      </LoadingGuard>
    </AppThemeProvider>
  );
}
