// src/app/acoes_pngi/layout.tsx
import TopBarNoLogin from '@/components/layout/TopBarNoLogin'

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-app-gradient">
      <TopBarNoLogin
          title="Dashboard de Ações PNGI"
          titleMinor="SEGER/SUBGES/GPP"
          primaryColor="#0253aa" 
      />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
