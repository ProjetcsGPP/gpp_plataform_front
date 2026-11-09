export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface PatriarcaEdocs {
  id: number;
  id_externo: string;
  sigla: string;
  nome: string;
  tipo_agente: number;
  descricao_tipo_agente: string;
  coletar_detalhes: boolean;
  ativo: boolean;
  versao: number;
  criado_em: string;
  atualizado_em: string;
  acoes_disponiveis: string[];
}

export interface ColetaPatriarcasEdocs {
  id: string;
  ambiente: string;
  situacao: string;
  iniciada_em: string;
  concluida_em: string | null;
  hash_fonte: string;
  quantidade_observados: number;
  quantidade_coincidentes: number;
  quantidade_novos: number;
  quantidade_alterados: number;
  quantidade_ausentes: number;
  quantidade_pendentes: number;
  codigo_erro: string;
  mensagem_erro: string;
  criado_por_id: number | null;
  criado_por_nome: string;
}

export interface DivergenciaPatriarcaEdocs {
  id: number;
  coleta_id: string;
  patriarca_id: number | null;
  id_externo: string;
  comparacao: string;
  situacao: string;
  dados_esperados: Record<string, unknown>;
  dados_observados: Record<string, unknown> | null;
  campos_alterados: string[];
  decisao: string;
  justificativa: string;
  revisado_por_id: number | null;
  revisado_por_nome: string;
  revisado_em: string | null;
  criado_em: string;
  decisoes_permitidas: string[];
  acoes_disponiveis: string[];
}

export interface EventoAuditoriaPatriarcaEdocs {
  id: number;
  coleta_id: string | null;
  patriarca_id: number | null;
  divergencia_id: number | null;
  tipo_evento: string;
  mensagem: string;
  dados_anteriores: Record<string, unknown> | null;
  dados_atuais: Record<string, unknown> | null;
  metadados: Record<string, unknown>;
  criado_por_id: number | null;
  criado_por_nome: string;
  criado_em: string;
}

export interface ListQuery {
  page: number;
  page_size: number;
  ordering?: string;
}

export interface PatriarcasQuery extends ListQuery {
  search?: string;
  ativo?: boolean;
  coletar_detalhes?: boolean;
}

export interface ColetasQuery extends ListQuery {
  situacao?: string;
}

export interface DivergenciasQuery extends ListQuery {
  situacao?: string;
  comparacao?: string;
  coleta_id?: string;
  patriarca_id?: number;
}

export interface AuditoriaQuery extends ListQuery {
  tipo_evento?: string;
  coleta_id?: string;
  patriarca_id?: number;
  divergencia_id?: number;
}

export interface SelecaoColetaPayload {
  coletar_detalhes: boolean;
  justificativa: string;
}

export interface DecisaoDivergenciaPayload {
  decisao: string;
  justificativa: string;
  coletar_detalhes?: boolean;
}

export interface MensagemEdocsWebSocket {
  evento: string;
  dados: Record<string, unknown>;
}
