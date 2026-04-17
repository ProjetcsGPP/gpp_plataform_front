// src/app/portal/layout.tsx  ← layout persistente para todo /portal/*
import { AppThemeProvider } from "@/components/common/AppThemeProvider";
import { LoadingGuard } from "@/components/common/LoadingGuard";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

export default function PortalLayout({
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
