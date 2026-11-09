export const EDOCS_ACTIONS = {
  ALTERAR_SELECAO_COLETA: "alterar_selecao_coleta",
  DECIDIR: "decidir",
} as const;

export function hasEdocsAction(
  availableActions: readonly string[],
  action: (typeof EDOCS_ACTIONS)[keyof typeof EDOCS_ACTIONS],
) {
  return availableActions.includes(action);
}
