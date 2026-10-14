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
  contextValue?: string;
  children: React.ReactNode;
}

export default function AppShell({
  appContext,
  title,
  titleMinor,
  contextValue,
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
                  contextValue={contextValue}
                />

                <main className="flex-1">
                  <div className="mx-auto w-full px-5 sm:px-8 xl:w-[85%] xl:px-0">
                    {children}
                  </div>
                </main>
              </div>
            </div>
          </LoadingGuard>
        </NavigationProvider>
      </AppThemeProvider>
    </AuthProvider>
  );
}
