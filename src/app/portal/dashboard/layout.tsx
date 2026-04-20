// src/app/portal/dashboard/layout.tsx
import { AuthProvider } from "@/components/common/AuthProvider";
import { NavigationProvider } from "@/components/common/NavigationProvider";
import { AuthHydrator } from "@/components/common/AuthHydrator";
import { LoadingGuard } from "@/components/common/LoadingGuard";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

export default function PortalDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AuthHydrator />
      <NavigationProvider>
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
      </NavigationProvider>
    </AuthProvider>
  );
}
