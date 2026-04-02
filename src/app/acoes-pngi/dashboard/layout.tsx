// src/app/acoes-pngi/dashboard/layout.tsx
import { AppThemeProvider } from '@/components/common/AppThemeProvider'
import TopBar from '@/components/layout/TopBar'

export default function AcoesPngiDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppThemeProvider appContext="ACOES_PNGI">
      <div className="min-h-screen flex flex-col bg-app-gradient">
        <TopBar
          title="Ações PNGI"
          titleMinor="SEGER/SUBGES/GPP"
        />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </AppThemeProvider>
  )
}
