// src/app/portal/dashboard/layout.tsx
import { AppThemeProvider } from '@/components/common/AppThemeProvider'
import TopBar from '@/components/layout/TopBar'

export default function PortalDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppThemeProvider appContext="PORTAL">
      <div className="min-h-screen flex flex-col bg-app-gradient">
        <TopBar
          title="Portal de Aplicações"
          titleMinor="SEGER/SUBGES/GPP"
          appContext="PORTAL"
        />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </AppThemeProvider>
  )
}
