// src/app/carga-org-lot/dashboard/layout.tsx
import { AppThemeProvider } from '@/components/common/AppThemeProvider'
import TopBar from '@/components/layout/TopBar'

export default function CargaOrgLotDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppThemeProvider appContext="CARGA_ORG_LOT">
      <div className="min-h-screen flex flex-col bg-app-gradient">
        <TopBar
          title="Carga Org/Lot"
          titleMinor="SEGER/SUBGES/GPP"
        />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </AppThemeProvider>
  )
}
