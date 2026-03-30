// src/app/carga_org_lot/layout.tsx
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
          primaryColor="#7d5457" 
      />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
