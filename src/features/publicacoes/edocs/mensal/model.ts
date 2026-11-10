import type { PaginatedResponse } from "@/features/publicacoes/edocs/model";

export type { PaginatedResponse };

export type SituacaoColetaMensalEdocs =
  | "AGENDADA"
  | "EM_EXECUCAO"
  | "CONCLUIDA"
  | "FALHOU";

export interface PatriarcaSolicitadoEdocs {
  id: number;
  id_externo: string;
  sigla: string;
  nome: string;
}

export interface ColetaMensalEdocs {
  id: string;
  ano: number;
  mes: number;
  revisao: number;
  ambiente: "HML" | "PRD";
  situacao: SituacaoColetaMensalEdocs;
  iniciada_em: string | null;
  concluida_em: string | null;
  quantidade_patriarcas: number;
  quantidade_organizacoes: number;
  quantidade_fontes_brutas: number;
  patriarcas_solicitados: PatriarcaSolicitadoEdocs[];
  hash_resultado: string;
  codigo_erro: string;
  mensagem_erro: string;
  criado_por_id: number | null;
  criado_por_nome: string;
  criado_em: string;
}

export interface ResultadoMensalPatriarcaEdocs {
  id: number;
  coleta_id: string;
  patriarca_id: number;
  id_patriarca_externo: string;
  sigla_patriarca: string;
  nome_patriarca: string;
  codigo_municipio: number | null;
  total_processos: number | null;
  total_documentos: number | null;
  total_paginas: number | null;
}

export interface ResultadoMensalOrganizacaoEdocs {
  id: number;
  coleta_id: string;
  patriarca_id: number;
  id_patriarca_externo: string;
  nome_patriarca: string;
  id_organizacao_externo: string;
  nome_organizacao: string;
  total_processos: number | null;
  total_documentos: number | null;
  total_paginas: number | null;
}

export interface FonteBrutaColetaMensalEdocs {
  id: number;
  coleta_id: string;
  codigo_fonte: "EDOC-01" | "EDOC-02" | "EDOC-03" | "EDOC-04" | "EDOC-05";
  patriarca_id: number | null;
  id_patriarca_externo: string | null;
  hash_sha256: string;
  criado_em: string;
}

export interface EventoAuditoriaColetaMensalEdocs {
  id: number;
  coleta_id: string;
  tipo_evento: "SOLICITADA" | "INICIADA" | "CONCLUIDA" | "FALHOU";
  mensagem: string;
  metadados: Record<string, unknown>;
  criado_por_id: number | null;
  criado_por_nome: string;
  criado_em: string;
}

export interface ColetasMensaisEdocsQuery {
  page: number;
  page_size: number;
  ano?: number;
  mes?: number;
  situacao?: SituacaoColetaMensalEdocs;
  ordering?: string;
}

export interface MonthlyDetailQuery {
  coleta_id: string;
  page: number;
  page_size: number;
  search?: string;
  ordering?: string;
}

export interface SolicitarColetaMensalEdocsPayload {
  ano: number;
  mes: number;
}
