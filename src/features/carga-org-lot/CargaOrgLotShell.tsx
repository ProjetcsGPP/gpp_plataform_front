"use client";

import AppShell from "@/components/layout/AppShell";
import { PatriarcaSelectionGuard } from "@/features/carga-org-lot/PatriarcaSelectionGuard";
import { usePatriarcaSelection } from "@/features/carga-org-lot/usePatriarcaSelection";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/lib/permissions";

export function CargaOrgLotShell({ children }: { children: React.ReactNode }) {
  const { selected } = usePatriarcaSelection();
  const { appContext, can, isHydrated } = usePermissions();
  const canShowSelection =
    appContext === "CARGA_ORG_LOT" &&
    isHydrated &&
    can(PERMISSIONS.PATRIARCA_VIEW);

  return (
    <AppShell
      appContext="CARGA_ORG_LOT"
      title="Carga Org/Lot"
      titleMinor="SEGER/SUBGES/GPP"
      contextValue={
        selected && canShowSelection
          ? `${selected.strsiglapatriarca} - ${selected.strnome}`
          : undefined
      }
    >
      <PatriarcaSelectionGuard>{children}</PatriarcaSelectionGuard>
    </AppShell>
  );
}
