import { AdminLoading } from "@/components/admin/AdminLoading";
import { RouteGuard } from "@/components/common/RouteGuard";
import { EdocsPage } from "@/features/publicacoes/edocs/EdocsUi";
import { ColetaMensalEdocsRequest } from "@/features/publicacoes/edocs/mensal/ColetaMensalEdocsRequest";
import { ColetaMensalEdocsHistoricalTotals } from "@/features/publicacoes/edocs/mensal/ColetaMensalEdocsHistoricalTotals";
import {
  ColetaMensalEdocsRevisions,
  monthlyCollectionRefreshInterval,
} from "@/features/publicacoes/edocs/mensal/ColetaMensalEdocsRevisions";
import { PERMISSIONS } from "@/lib/permissions";

export { monthlyCollectionRefreshInterval };

export function ColetaMensalEdocsPage() {
  return (
    <RouteGuard
      permission={PERMISSIONS.EDOCS_MENSAL_COLETA_VIEW}
      loadingFallback={<AdminLoading label="Verificando acesso às coletas mensais..." />}
    >
      <EdocsPage
        title="Coleta de Dados — E-Docs"
        description="Solicite e consulte revisões mensais dos indicadores E-Docs. A coleta é independente de qualquer publicação."
      >
        <div className="space-y-6">
          <ColetaMensalEdocsRequest />
          <ColetaMensalEdocsHistoricalTotals />
          <ColetaMensalEdocsRevisions />
        </div>
      </EdocsPage>
    </RouteGuard>
  );
}
