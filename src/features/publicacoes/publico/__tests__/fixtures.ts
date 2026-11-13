import type { PublicPublication } from "../model";

export const publicPublication: PublicPublication = {
  id: "11111111-1111-1111-1111-111111111111",
  schema_version: "1.0",
  versao: 1,
  titulo: "Resultados institucionais",
  competencia: "2024-06",
  publicada_em: "2024-07-01T10:00:00Z",
  secoes: [
    {
      ordem: 1,
      codigo: "MUNICIPIOS_EDOCS_PUBLICO",
      titulo: "Resultados E-Docs",
      fonte: "EDOCS",
      perfil_calculo: "PLANILHA_MUNICIPIOS_V1",
      conteudo: {
        quantidade_patriarcas: 1,
        totais: { total_paginas: 10 },
        patriarcas: [],
        mapas: [{
          schema_version: "1.0", tipo: "MAPA_MUNICIPAL", indicador: "IMPLANTACAO_EDOCS",
          titulo: "Implantação do E-Docs", competencia: "2024-06", referencia_temporal: "COMPETENCIA",
          modo: "CATEGORICO", unidade: null, precisao: null, texto_sem_dados: "Sem dados",
          legenda: [{ codigo: "SEM_DADOS", rotulo: "Sem dados", cor: "#d1d5db", ordem: 1 }],
          municipios: [{ codigo_ibge: "3200201", nome: "Alegre", categoria: "SEM_DADOS", valor: null, texto_alternativo: "Alegre: sem dados" }], proveniencia: { origem: "PUBLICACAO" },
        }],
        series_historicas: [{ codigo: "TOTAL_PAGINAS", titulo: "Páginas", periodicidade: "MENSAL", natureza: "FLUXO_MENSAL", unidade: "páginas", precisao: 0, serie_completa: true, pontos: [
          { competencia: "2024-05", valor: "4", valor_acumulado: "4", proveniencia: { tipo: "PUBLICACAO" } },
          { competencia: "2024-06", valor: "6", valor_acumulado: "10", proveniencia: { tipo: "PUBLICACAO" } },
        ] }],
        consolidados_historicos_patriarcas: [{ posicao: 1, codigo_municipio: 3200201, nome_municipio: "Alegre", sigla_patriarca: "PMA", nome_patriarca: "Prefeitura Municipal de Alegre", competencias_consideradas: 2, economia_total_reais: "100.00" }],
      },
    },
    {
      ordem: 2,
      codigo: "GERAL_EFLOW",
      titulo: "Resultados E-Flow",
      fonte: "EFLOW",
      perfil_calculo: "CONSOLIDADO_PUBLICACAO",
      conteudo: {
        quantidade_fluxos: 15,
        quantidade_orgaos_participantes: 2,
        quantidade_setores_ativos: 4,
        orgaos_maior_quantidade_fluxos: [{ orgao: "SEGER", quantidade_fluxos: 9, percentual: "60.00" }],
        distribuicao_publico_alvo: [{ publico_alvo: "CIDADÃO", quantidade_fluxos: 15, percentual: "100.00" }],
        series_historicas: [{ codigo: "QUANTIDADE_FLUXOS", titulo: "Total de fluxos", periodicidade: "MENSAL", natureza: "ESTOQUE_VIGENTE", unidade: "fluxos", precisao: 0, serie_completa: true, pontos: [{ competencia: "2024-06", valor: "15", valor_acumulado: null, proveniencia: { tipo: "PUBLICACAO" } }] }],
      },
    },
  ],
};
