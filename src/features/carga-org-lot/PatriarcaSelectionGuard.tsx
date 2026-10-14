"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2 } from "lucide-react";

import { AdminPage, AdminPanel } from "@/components/admin/AdminPage";
import { Button } from "@/components/ui/button";
import { usePatriarcaSelection } from "@/features/carga-org-lot/usePatriarcaSelection";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/lib/permissions";

export function PatriarcaSelectionGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { selected } = usePatriarcaSelection();
  const { can } = usePermissions();
  const isSelectionRoute =
    pathname === "/carga-org-lot/patriarcas";

  if (selected || isSelectionRoute) return <>{children}</>;

  return (
    <AdminPage
      title="Selecione um patriarca"
      description="Escolha o patriarca que será usado como contexto de trabalho antes de continuar."
    >
      <AdminPanel className="mx-auto max-w-xl p-8 text-center">
        <Building2 className="mx-auto size-10 text-app-primary" aria-hidden="true" />
        <p className="mt-4 text-sm text-slate-600">
          Organogramas, lotações e demais operações dependem de um patriarca selecionado.
        </p>
        {can(PERMISSIONS.PATRIARCA_VIEW) && (
          <Button asChild className="mt-5">
            <Link href="/carga-org-lot/patriarcas">Escolher patriarca</Link>
          </Button>
        )}
      </AdminPanel>
    </AdminPage>
  );
}
