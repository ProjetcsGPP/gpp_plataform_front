import { PublicacoesPendingResourcePage } from "@/features/publicacoes/PublicacoesPendingResourcePage";
import { PERMISSIONS } from "@/lib/permissions";

export default function ColetasEdocsPage() {
  return (
    <PublicacoesPendingResourcePage
      title="Coletas E-Docs"
      description="Acompanhamento das coletas de publicações institucionais no E-Docs."
      permission={PERMISSIONS.EDOCS_COLETA_VIEW}
    />
  );
}
