import { PublicacoesPendingResourcePage } from "@/features/publicacoes/PublicacoesPendingResourcePage";
import { PERMISSIONS } from "@/lib/permissions";

export default function DivergenciasEdocsPage() {
  return (
    <PublicacoesPendingResourcePage
      title="Divergências E-Docs"
      description="Consulta das divergências identificadas nas publicações do E-Docs."
      permission={PERMISSIONS.EDOCS_DIVERGENCIA_VIEW}
    />
  );
}
