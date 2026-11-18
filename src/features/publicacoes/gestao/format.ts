import type { SituacaoPublicacao } from "./model";

export const SITUACAO_LABELS: Record<SituacaoPublicacao, string> = {
  RASCUNHO: "Rascunho", EM_VALIDACAO: "Em validação",
  AGUARDANDO_PUBLICACAO: "Aguardando publicação", PUBLICADA: "Publicada",
  SUBSTITUIDA: "Substituída", CANCELADA: "Cancelada", REVOGADA: "Revogada",
};
export const actionAvailable = (actions: string[], action: string) => actions.includes(action);
export const canUsePublicationAction = (
  hasTechnicalPermission: boolean,
  actions: string[],
  action: string,
) => hasTechnicalPermission && actionAvailable(actions, action);
export const personalizedScopeIsValid = (scope: string, patriarchIds: number[]) =>
  scope !== "PERSONALIZADO" || patriarchIds.length > 0;
export const formatNumber = (value: unknown) => {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number.toLocaleString("pt-BR") : "—";
};
export const formatDecimal = (value: unknown, digits = 2) => {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number.toLocaleString("pt-BR", { maximumFractionDigits: digits }) : "—";
};
