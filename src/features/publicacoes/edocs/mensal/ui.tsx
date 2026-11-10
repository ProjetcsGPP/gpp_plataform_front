import { EdocsStatusBadge } from "@/features/publicacoes/edocs/EdocsUi";
import type { SituacaoColetaMensalEdocs } from "@/features/publicacoes/edocs/mensal/model";

export function MonthlyStatus({ status }: { status: SituacaoColetaMensalEdocs }) {
  return (
    <EdocsStatusBadge positive={status === "CONCLUIDA"} negative={status === "FALHOU"}>
      {status.replaceAll("_", " ")}
    </EdocsStatusBadge>
  );
}

export function formatCompetence(year: number, month: number) {
  return `${String(month).padStart(2, "0")}/${year}`;
}
