import type { PaginatedResponse, PatriarcaEdocs } from "@/features/publicacoes/edocs/model";
import type { MapaMunicipalCongelado } from "@/features/publicacoes/mapa/model";

export type { PaginatedResponse };
export type FonteVisao = "EDOCS" | "EFLOW";
export type EscopoVisao = "TODOS" | "MUNICIPIOS" | "PERSONALIZADO";
export type PerfilEflow = "COMPLETO_TECNICO" | "CONSOLIDADO_PUBLICACAO";
export type SituacaoPublicacao =
  | "RASCUNHO" | "EM_VALIDACAO" | "AGUARDANDO_PUBLICACAO"
  | "PUBLICADA" | "SUBSTITUIDA" | "CANCELADA" | "REVOGADA";

export interface VisaoPublicacao {
  id: string; codigo: string; nome: string; descricao: string;
  fonte: FonteVisao; escopo: EscopoVisao; perfil_calculo_eflow: PerfilEflow | "";
  ativa: boolean; versao: number; patriarcas_ids: number[];
  criado_em: string; atualizado_em: string;
}

export interface SecaoPublicacao {
  id: string; ordem: number; titulo: string; fonte: FonteVisao;
  configuracao_visao_id: string; coleta_edocs_id: string | null;
  coleta_eflow_id: string | null; perfil_calculo: string;
  configuracao_congelada: Record<string, unknown>;
  resultado: ResultadoSecaoPublicacao; calculada_em: string | null;
  hash_resultado: string;
}

export interface ResultadoSecaoPublicacao extends Record<string, unknown> {
  mapas?: MapaMunicipalCongelado[];
}

export interface Publicacao {
  id: string; serie_id: string; versao: number; titulo: string;
  ano_referencia: number; mes_referencia: number; competencia: string;
  situacao: SituacaoPublicacao; versao_registro: number;
  publicacao_anterior_id: string | null; justificativa_publicacao: string;
  publicada_em: string | null; publicada_por_id: number | null;
  publicada_por_nome: string; hash_conteudo: string;
  secoes: SecaoPublicacao[]; acoes_disponiveis: string[];
  criado_em: string; atualizado_em: string;
}

export interface HistoricoPublicacao {
  id: number; tipo_evento: string; situacao_anterior: string;
  situacao_atual: string; justificativa: string;
  metadados: Record<string, unknown>; criado_por_id: number | null;
  criado_por_nome: string; criado_em: string;
}

export interface PublicacoesQuery {
  page: number; page_size: number; ano_referencia?: number; mes_referencia?: number;
  situacao?: SituacaoPublicacao; search?: string; ordering?: string;
}

export interface VisaoPayload {
  codigo: string; nome: string; descricao: string; fonte: FonteVisao;
  escopo: EscopoVisao; perfil_calculo_eflow?: PerfilEflow | "";
  ativa: boolean; patriarcas_ids: number[];
}

export type PatriarcaOption = Pick<PatriarcaEdocs, "id" | "sigla" | "nome">;
