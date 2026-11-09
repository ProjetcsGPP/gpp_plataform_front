import { PublicacoesPendingResourcePage } from "@/features/publicacoes/PublicacoesPendingResourcePage";
import { PERMISSIONS } from "@/lib/permissions";

export default function PatriarcasEdocsPage() {
  return (
    <PublicacoesPendingResourcePage
      title="Patriarcas E-Docs"
      description="Consulta e acompanhamento do catálogo de patriarcas do E-Docs."
      permission={PERMISSIONS.EDOCS_PATRIARCA_VIEW}
    />
  );
}
