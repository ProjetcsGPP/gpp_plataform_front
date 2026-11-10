import type { PaginatedResponse } from "@/features/publicacoes/edocs/model";

export type { PaginatedResponse };

export type SituacaoColetaEflow =
  | "EM_PROCESSAMENTO"
  | "CONCLUIDA"
  | "FALHOU";

export type PerfilCalculoEflow =
  | "COMPLETO_TECNICO"
  | "CONSOLIDADO_PUBLICACAO";

export interface IndicadorOrgaoEflow {
  patriarca: string | null;
  orgao: string;
  quantidade_fluxos: number;
  percentual: string;
}

export interface IndicadorPublicoAlvoEflow {
  publico_alvo: string;
  quantidade_fluxos: number;
  percentual: string;
}

export interface ResultadoCalculoEflow {
  id: number;
  coleta_id: string;
  perfil: PerfilCalculoEflow;
  quantidade_fluxos: number;
  quantidade_orgaos_participantes: number;
  quantidade_setores_ativos: number;
  orgaos_maior_quantidade_fluxos: IndicadorOrgaoEflow[];
  distribuicao_publico_alvo: IndicadorPublicoAlvoEflow[];
  calculado_em: string;
}

export interface ColetaEflow {
  id: string;
  situacao: SituacaoColetaEflow;
  arquivo_nome: string;
  arquivo_hash_sha256: string;
  arquivo_tamanho_bytes: number;
  iniciada_em: string;
  concluida_em: string | null;
  quantidade_fluxos: number;
  quantidade_orgaos_participantes: number;
  quantidade_setores_ativos: number;
  orgaos_maior_quantidade_fluxos: IndicadorOrgaoEflow[];
  distribuicao_publico_alvo: IndicadorPublicoAlvoEflow[];
  codigo_erro: string;
  mensagem_erro: string;
  resultados_calculo: ResultadoCalculoEflow[];
  criado_por_id: number | null;
  criado_por_nome: string;
}

export interface PreferenciaExibicaoEflow {
  id: number;
  usuario_id: number;
  perfil_preferido: PerfilCalculoEflow;
  atualizado_em: string;
  atualizado_por_id: number | null;
  atualizado_por_nome: string;
  acoes_disponiveis: string[];
}

export interface EventoAuditoriaPreferenciaEflow {
  id: number;
  preferencia_id: number;
  tipo_evento: "PREFERENCIA_INICIALIZADA" | "PREFERENCIA_ALTERADA";
  perfil_anterior: PerfilCalculoEflow | null;
  perfil_atual: PerfilCalculoEflow;
  criado_por_id: number | null;
  criado_por_nome: string;
  criado_em: string;
}

export interface DefinicaoFluxoEflow {
  id: number;
  coleta_id: string;
  id_externo: string;
  nome: string;
  versao_origem: number;
  publico_alvo: string;
  patriarca_id: number;
  patriarca_sigla: string;
  patriarca_nome: string;
  patriarca_texto: string;
  orgao: string;
  setor: string;
}

export interface EventoAuditoriaEflow {
  id: number;
  coleta_id: string;
  tipo_evento: string;
  mensagem: string;
  metadados: Record<string, unknown>;
  criado_por_id: number | null;
  criado_por_nome: string;
  criado_em: string;
}

export interface ColetasEflowQuery {
  page: number;
  page_size: number;
  situacao?: SituacaoColetaEflow;
  ordering?: string;
}

export interface DefinicoesEflowQuery {
  page: number;
  page_size: number;
  coleta_id: string;
  patriarca_id?: number;
  publico_alvo?: string;
  search?: string;
  ordering?: string;
}

export interface AuditoriaEflowQuery {
  page: number;
  page_size: number;
  coleta_id: string;
  tipo_evento?: string;
  ordering?: string;
}

export interface ResultadosEflowQuery {
  page: number;
  page_size: number;
  coleta_id?: string;
  perfil?: PerfilCalculoEflow;
  ordering?: string;
}

export interface AuditoriaPreferenciaEflowQuery {
  page: number;
  page_size: number;
  ordering?: string;
}
