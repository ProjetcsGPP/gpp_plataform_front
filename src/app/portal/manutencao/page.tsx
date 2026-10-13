// src/app/portal/manutencao/page.tsx
// Pagina publica de manutencao do portal.
// Fica FORA do dashboard/layout (sem Sidebar/TopBar) mas DENTRO do
// portal/layout (AppThemeProvider permanece montado).
//
// O middleware redireciona para esta pagina quando
// NEXT_PUBLIC_PORTAL_MAINTENANCE=true
import { MaintenanceMode } from '@/components/common/MaintenanceMode'

export default function PortalManutencaoPage() {
  return (
    <MaintenanceMode
      systemName="Portal GPP"
      returnForecast={process.env.NEXT_PUBLIC_MAINTENANCE_RETURN ?? undefined}
      message={process.env.NEXT_PUBLIC_MAINTENANCE_MESSAGE ?? undefined}
    />
  )
}
