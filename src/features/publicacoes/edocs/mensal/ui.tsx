import { EdocsStatusBadge } from "@/features/publicacoes/edocs/EdocsUi";
import type { SituacaoColetaMensalEdocs } from "@/features/publicacoes/edocs/mensal/model";

export const monthlyStatusLabels = {
  SOLICITADA: "Solicitada",
  EXECUTANDO: "Executando",
  SUCESSO: "Sucesso",
  ERRO: "Erro",
} satisfies Record<SituacaoColetaMensalEdocs, string>;

export const terminalMonthlyStatuses = new Set<SituacaoColetaMensalEdocs>([
  "SUCESSO",
  "ERRO",
]);

export function MonthlyStatus({ status }: { status: SituacaoColetaMensalEdocs }) {
  return (
    <EdocsStatusBadge positive={status === "SUCESSO"} negative={status === "ERRO"}>
      {monthlyStatusLabels[status]}
    </EdocsStatusBadge>
  );
}

export function formatCompetence(year: number, month: number) {
  return `${String(month).padStart(2, "0")}/${year}`;
}
