import type {
  ColetaEflow,
  PerfilCalculoEflow,
  ResultadoCalculoEflow,
} from "@/features/publicacoes/eflow/model";

export const EFLOW_PROFILE_LABELS: Record<PerfilCalculoEflow, string> = {
  COMPLETO_TECNICO: "Completo técnico",
  CONSOLIDADO_PUBLICACAO: "Consolidado para publicação",
};

export const EFLOW_PREFERENCE_ACTION = "alterar_preferencia_exibicao";

export function findResultByProfile(
  coleta: ColetaEflow,
  profile: PerfilCalculoEflow,
): ResultadoCalculoEflow | undefined {
  return coleta.resultados_calculo.find((result) => result.perfil === profile);
}
