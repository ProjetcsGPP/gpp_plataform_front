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
          title="Orquestrador de Aplicaçãoes"
          titleMinor="SEGER/SUBGES/GPP"
          primaryColor="#3b3a65" 
      />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
