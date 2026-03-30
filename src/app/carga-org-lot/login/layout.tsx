// src/app/portal/layout.tsx
import TopBarNoLogin from '@/components/layout/TopBarNoLogin'

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-app-gradient">
      <TopBarNoLogin
          title="Carga de Organograma e Lotações"
          titleMinor="SEGER/SUBGES/GPP"
      />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
