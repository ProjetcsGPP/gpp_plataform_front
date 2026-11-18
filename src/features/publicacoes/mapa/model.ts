export type CategoriaMapaMunicipalConhecida =
  | "IMPLANTADO_COM_USO_EDOCS"
  | "IMPLANTADO_SEM_USO_EDOCS"
  | "EM_IMPLANTACAO"
  | "MANIFESTOU_INTERESSE"
  | "SEM_DADOS";

export type CategoriaMapaMunicipal =
  | CategoriaMapaMunicipalConhecida
  | (string & Record<never, never>);

export interface LegendaMapaMunicipal {
  codigo: CategoriaMapaMunicipal;
  rotulo: string;
  cor: string;
  ordem: number;
}

export type ValorIndicadorMunicipal = string | number | null;

export interface IndicadoresEdocsMunicipio {
  total_processos?: ValorIndicadorMunicipal;
  total_documentos?: ValorIndicadorMunicipal;
  total_paginas?: ValorIndicadorMunicipal;
  economia_papel_kg?: ValorIndicadorMunicipal;
  gases_poluentes_kg?: ValorIndicadorMunicipal;
  economia_papel_reais?: ValorIndicadorMunicipal;
  economia_insumos_reais?: ValorIndicadorMunicipal;
  economia_impressao_reais?: ValorIndicadorMunicipal;
  economia_total_reais?: ValorIndicadorMunicipal;
  economia_agua_m3?: ValorIndicadorMunicipal;
  arvores_salvas?: ValorIndicadorMunicipal;
  competencias_consideradas?: ValorIndicadorMunicipal;
}

export interface DadosEdocsMunicipio {
  mes?: IndicadoresEdocsMunicipio;
  acumulado?: IndicadoresEdocsMunicipio;
}

export interface OrgaoEflowMunicipio {
  patriarca?: string;
  orgao: string;
  quantidade_fluxos: ValorIndicadorMunicipal;
  percentual: ValorIndicadorMunicipal;
}

export interface PublicoAlvoEflowMunicipio {
  publico_alvo: string;
  quantidade_fluxos: ValorIndicadorMunicipal;
  percentual: ValorIndicadorMunicipal;
}

export interface DadosEflowMunicipio {
  quantidade_fluxos?: ValorIndicadorMunicipal;
  quantidade_orgaos_participantes?: ValorIndicadorMunicipal;
  quantidade_setores_ativos?: ValorIndicadorMunicipal;
  orgaos_maior_quantidade_fluxos?: OrgaoEflowMunicipio[];
  distribuicao_publico_alvo?: PublicoAlvoEflowMunicipio[];
}

export interface MunicipioMapaCongelado {
  codigo_ibge: string;
  nome: string;
  categoria: CategoriaMapaMunicipal;
  valor?: string | number | null;
  texto_alternativo: string;
  edocs?: DadosEdocsMunicipio;
  eflow?: DadosEflowMunicipio;
}

export interface MapaMunicipalCongelado {
  schema_version: "1.0" | "1.1";
  tipo: "MAPA_MUNICIPAL";
  indicador: "IMPLANTACAO_EDOCS" | (string & Record<never, never>);
  titulo: string;
  competencia: string;
  referencia_temporal: "COMPETENCIA" | (string & Record<never, never>);
  modo: "CATEGORICO" | (string & Record<never, never>);
  unidade?: string | null;
  "unidade de valor"?: string | null;
  precisao: number | null;
  texto_sem_dados: string;
  legenda: LegendaMapaMunicipal[];
  municipios: MunicipioMapaCongelado[];
  proveniencia: Record<string, unknown>;
}

export interface MunicipioVisualMapa {
  codigoIbge: string;
  nome: string;
  cor: string;
  textoAlternativo: string;
  municipio: MunicipioMapaCongelado | null;
}

export const COR_AUSENCIA_MAPA = "#d1d5db";

export function isCategoriaMapaMunicipalConhecida(
  value: string,
): value is CategoriaMapaMunicipalConhecida {
  return value === "IMPLANTADO_COM_USO_EDOCS"
    || value === "IMPLANTADO_SEM_USO_EDOCS"
    || value === "EM_IMPLANTACAO"
    || value === "MANIFESTOU_INTERESSE"
    || value === "SEM_DADOS";
}

export function isMapaMunicipalCongelado(
  value: unknown,
): value is MapaMunicipalCongelado {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const map = value as Record<string, unknown>;
  return map.tipo === "MAPA_MUNICIPAL"
    && map.indicador === "IMPLANTACAO_EDOCS"
    && (map.schema_version === "1.0" || map.schema_version === "1.1")
    && typeof map.titulo === "string"
    && typeof map.competencia === "string"
    && typeof map.texto_sem_dados === "string"
    && Array.isArray(map.legenda)
    && Array.isArray(map.municipios);
}

export function resolveMunicipioVisual(
  codigoIbge: string,
  nomeGeoJson: string,
  mapa: MapaMunicipalCongelado,
): MunicipioVisualMapa {
  const municipio = mapa.municipios.find(
    (item) => item.codigo_ibge === codigoIbge,
  ) ?? null;
  const absence = mapa.legenda.find((item) => item.codigo === "SEM_DADOS");
  const legend = municipio && isCategoriaMapaMunicipalConhecida(municipio.categoria)
    ? mapa.legenda.find((item) => item.codigo === municipio.categoria)
    : null;
  return {
    codigoIbge,
    nome: municipio?.nome || nomeGeoJson,
    cor: legend?.cor || absence?.cor || COR_AUSENCIA_MAPA,
    textoAlternativo: municipio?.texto_alternativo
      || `${nomeGeoJson}: ${mapa.texto_sem_dados}`,
    municipio,
  };
}

export function mapasMunicipaisDoResultado(
  resultado: Record<string, unknown> | null | undefined,
): MapaMunicipalCongelado[] {
  return resultado && Array.isArray(resultado.mapas)
    ? resultado.mapas.filter(isMapaMunicipalCongelado)
    : [];
}
