import { PublicacoesPendingResourcePage } from "@/features/publicacoes/PublicacoesPendingResourcePage";
import { PERMISSIONS } from "@/lib/permissions";

export default function AuditoriaEdocsPage() {
  return (
    <PublicacoesPendingResourcePage
      title="Auditoria E-Docs"
      description="Consulta dos eventos de auditoria das publicações institucionais."
      permission={PERMISSIONS.EDOCS_EVENTO_AUDITORIA_VIEW}
    />
  );
}
