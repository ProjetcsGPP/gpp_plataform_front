import type { MapaMunicipalCongelado } from "@/features/publicacoes/mapa/model";

export type PublicValue = string | number | null | undefined;
export type PublicSource = "EDOCS" | "EFLOW" | (string & Record<never, never>);

export interface PublicSeriesPoint {
  competencia: string;
  valor: string | null;
  valor_acumulado: string | null;
  proveniencia: Record<string, unknown>;
}

export interface PublicSeries {
  codigo: string;
  titulo: string;
  periodicidade: string;
  natureza: string;
  unidade: string | null;
  precisao: number | null;
  serie_completa: boolean;
  pontos: PublicSeriesPoint[];
}

export interface PublicPatriarchResult extends Record<string, PublicValue> {
  codigo_municipio: number | null;
  nome_municipio: string | null;
  sigla_patriarca: string;
  nome_patriarca: string;
  versao_calculo?: string;
}

export interface PublicHistoricalPatriarch extends Record<string, PublicValue> {
  posicao: number;
  codigo_municipio: number | null;
  nome_municipio: string | null;
  sigla_patriarca: string;
  nome_patriarca: string;
  competencias_consideradas: number;
}

export interface PublicEdocsContent extends Record<string, unknown> {
  quantidade_patriarcas: number;
  totais: Record<string, PublicValue>;
  patriarcas: PublicPatriarchResult[];
  mapas: MapaMunicipalCongelado[];
  series_historicas: PublicSeries[];
  consolidados_historicos_patriarcas: PublicHistoricalPatriarch[];
}

export interface PublicEflowRanking {
  patriarca?: string;
  orgao: string;
  quantidade_fluxos: number;
  percentual: string | number;
}

export interface PublicEflowAudience {
  publico_alvo: string;
  quantidade_fluxos: number;
  percentual: string | number;
}

export interface PublicEflowContent extends Record<string, unknown> {
  quantidade_fluxos: number;
  quantidade_orgaos_participantes: number;
  quantidade_setores_ativos: number;
  orgaos_maior_quantidade_fluxos: PublicEflowRanking[];
  distribuicao_publico_alvo: PublicEflowAudience[];
  series_historicas: PublicSeries[];
}

export interface PublicSection {
  ordem: number;
  codigo: string | null;
  titulo: string;
  fonte: PublicSource;
  perfil_calculo: string;
  conteudo: PublicEdocsContent | PublicEflowContent | Record<string, unknown>;
}

export interface PublicPublicationSummary {
  id: string;
  versao: number;
  titulo: string;
  competencia: string;
  publicada_em: string;
}

export interface PublicPublication extends PublicPublicationSummary {
  schema_version: string;
  secoes: PublicSection[];
}

export interface PublicHistory {
  schema_version: string;
  quantidade: number;
  resultados: PublicPublicationSummary[];
}

export interface PublicSeriesPublication extends PublicPublicationSummary {
  schema_version: string;
  secoes: Array<Pick<PublicSection, "ordem" | "codigo" | "titulo" | "fonte"> & {
    series_historicas: PublicSeries[];
  }>;
}

export type PublicErrorCode =
  | "PUBLICACAO_NAO_DISPONIVEL"
  | "PUBLICACAO_NAO_ENCONTRADA"
  | "PUBLICACAO_REVOGADA"
  | "LIMITE_PUBLICO_EXCEDIDO"
  | "PUBLICACAO_TEMPORARIAMENTE_INDISPONIVEL"
  | "OFFLINE"
  | "FALHA_CONEXAO";

export class PublicDistributionError extends Error {
  constructor(
    public readonly code: PublicErrorCode,
    public readonly status: number | null,
    public readonly retryAfter: number | null,
    message: string,
  ) {
    super(message);
    this.name = "PublicDistributionError";
  }
}
