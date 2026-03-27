// src/app/portal/layout.tsx
import TopBar from '@/components/layout/TopBar'

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
        <TopBar 
          title="Portal de Aplicações"
          titleMinor="SEGER/SUBGES/GPP"
        />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
