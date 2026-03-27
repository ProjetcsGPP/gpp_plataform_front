// src/app/_lab/layout.tsx
// Layout isolado para o laboratório de componentes.
// Não usa o layout root — carrega Sidebar e TopBar localmente.
export default function LabLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {children}
    </div>
  )
}
