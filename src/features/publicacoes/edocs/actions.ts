export const EDOCS_ACTIONS = {
  ALTERAR_SELECAO_COLETA: "alterar_selecao_coleta",
  ALTERAR_INDICADORES_MUNICIPAIS: "alterar_indicadores_municipais",
  ALTERAR_INDICADOR_SEM_USO: "alterar_indicador_municipio_sem_edocs",
  DECIDIR: "decidir",
  CORRIGIR_CADASTRO_MUNICIPIO: "corrigir_cadastro",
  ALTERAR_SITUACAO_MUNICIPIO: "alterar_situacao",
} as const;

export function hasEdocsAction(
  availableActions: readonly string[],
  action: (typeof EDOCS_ACTIONS)[keyof typeof EDOCS_ACTIONS],
) {
  return availableActions.includes(action);
}
