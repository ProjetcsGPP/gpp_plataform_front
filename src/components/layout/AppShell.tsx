import type { AppContext } from "@/types/auth";
import { AuthProvider } from "@/components/common/AuthProvider";
import { AppThemeProvider } from "@/components/common/AppThemeProvider";
import { AuthHydrator } from "@/components/common/AuthHydrator";
import { NavigationProvider } from "@/components/common/NavigationProvider";
import { LoadingGuard } from "@/components/common/LoadingGuard";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

interface AppShellProps {
  appContext: AppContext;
  title: string;
  titleMinor: string;
  children: React.ReactNode;
}

export default function AppShell({
  appContext,
  title,
  titleMinor,
  children,
}: AppShellProps) {
  return (
    <AuthProvider>
      <AppThemeProvider appContext={appContext}>
        <AuthHydrator />
        <NavigationProvider>
          <LoadingGuard>
            <div className="min-h-screen flex bg-app-gradient">
              <Sidebar appContext={appContext} />
              <div className="flex flex-col flex-1 pl-18">
                <TopBar
                  title={title}
                  titleMinor={titleMinor}
                  appContext={appContext}
                />

                <main className="flex-1">{children}</main>
              </div>
            </div>
          </LoadingGuard>
        </NavigationProvider>
      </AppThemeProvider>
    </AuthProvider>
  );
}
