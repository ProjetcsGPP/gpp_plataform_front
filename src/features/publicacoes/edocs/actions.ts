export const EDOCS_ACTIONS = {
  ALTERAR_SELECAO_COLETA: "alterar_selecao_coleta",
  ALTERAR_INDICADORES_MUNICIPAIS: "alterar_indicadores_municipais",
  DECIDIR: "decidir",
} as const;

export function hasEdocsAction(
  availableActions: readonly string[],
  action: (typeof EDOCS_ACTIONS)[keyof typeof EDOCS_ACTIONS],
) {
  return availableActions.includes(action);
}
