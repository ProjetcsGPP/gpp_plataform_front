// Layout raiz do portal — neutro, sem Sidebar/TopBar
// Mantém AppThemeProvider montado para todas as rotas /portal/*
// evitando remontagem ao navegar entre rotas (inclusive ao voltar de 404)
import { AppThemeProvider } from "@/components/common/AppThemeProvider";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppThemeProvider appContext="PORTAL">
      {children}
    </AppThemeProvider>
  );
}
