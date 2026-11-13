import { describe, expect, it } from "vitest";

import {
  COR_AUSENCIA_MAPA,
  mapasMunicipaisDoResultado,
  resolveMunicipioVisual,
  type MapaMunicipalCongelado,
} from "../model";

export const frozenMap: MapaMunicipalCongelado = {
  schema_version: "1.1",
  tipo: "MAPA_MUNICIPAL",
  indicador: "IMPLANTACAO_EDOCS",
  titulo: "Implantação do E-Docs nos municípios",
  competencia: "2026-10",
  referencia_temporal: "COMPETENCIA",
  modo: "CATEGORICO",
  unidade: null,
  precisao: null,
  texto_sem_dados: "Sem evidência congelada",
  legenda: [
    { codigo: "SEM_DADOS", rotulo: "Sem dados", cor: "#cccccc", ordem: 3 },
    { codigo: "IMPLANTADO_SEM_USO_EDOCS", rotulo: "Sem uso", cor: "#f59e0b", ordem: 2 },
    { codigo: "IMPLANTADO_COM_USO_EDOCS", rotulo: "Com uso", cor: "#10b981", ordem: 1 },
    { codigo: "EM_IMPLANTACAO", rotulo: "Em implantação", cor: "#3b82f6", ordem: 4 },
    { codigo: "MANIFESTOU_INTERESSE", rotulo: "Manifestou interesse", cor: "#93c5fd", ordem: 5 },
  ],
  municipios: [
    {
      codigo_ibge: "3200102",
      nome: "Afonso Cláudio",
      categoria: "IMPLANTADO_COM_USO_EDOCS",
      valor: 1,
      texto_alternativo: "Afonso Cláudio: E-Docs implantado e em uso",
      edocs: {
        mes: {
          total_processos: 10,
          total_documentos: 20,
          total_paginas: 30,
          economia_total_reais: "40.50",
        },
        acumulado: {
          competencias_consideradas: 3,
          total_processos: 100,
          total_documentos: 200,
          total_paginas: 300,
          economia_total_reais: "400.50",
        },
      },
      eflow: {
        quantidade_fluxos: 15,
        quantidade_orgaos_participantes: 4,
        quantidade_setores_ativos: 7,
        orgaos_maior_quantidade_fluxos: [
          { patriarca: "PREFEITURA", orgao: "SEMAD", quantidade_fluxos: 9, percentual: "60.00" },
        ],
        distribuicao_publico_alvo: [
          { publico_alvo: "CIDADÃO", quantidade_fluxos: 12, percentual: "80.00" },
        ],
      },
    },
    { codigo_ibge: "3200201", nome: "Alegre", categoria: "IMPLANTADO_SEM_USO_EDOCS", valor: null, texto_alternativo: "Alegre: implantado sem uso do E-Docs" },
    { codigo_ibge: "3200300", nome: "Alfredo Chaves", categoria: "SEM_DADOS", valor: null, texto_alternativo: "Alfredo Chaves: sem dados disponíveis" },
    { codigo_ibge: "3200409", nome: "Anchieta", categoria: "EM_IMPLANTACAO", valor: null, texto_alternativo: "Anchieta: em implantação" },
    { codigo_ibge: "3200508", nome: "Apiacá", categoria: "MANIFESTOU_INTERESSE", valor: null, texto_alternativo: "Apiacá: manifestou interesse" },
  ],
  proveniencia: { origem: "snapshot" },
};

describe("mapa municipal congelado", () => {
  it("associa exclusivamente por código IBGE e preserva a prevalência congelada de uso observado", () => {
    expect(resolveMunicipioVisual("3200102", "Nome geométrico", frozenMap)).toMatchObject({
      nome: "Afonso Cláudio",
      cor: "#10b981",
      textoAlternativo: "Afonso Cláudio: E-Docs implantado e em uso",
    });
  });

  it("renderiza todas as categorias V2 usando somente a legenda recebida", () => {
    expect(resolveMunicipioVisual("3200102", "", frozenMap).cor).toBe("#10b981");
    expect(resolveMunicipioVisual("3200201", "", frozenMap).cor).toBe("#f59e0b");
    expect(resolveMunicipioVisual("3200300", "", frozenMap).cor).toBe("#cccccc");
    expect(resolveMunicipioVisual("3200409", "", frozenMap).cor).toBe("#3b82f6");
    expect(resolveMunicipioVisual("3200508", "", frozenMap).cor).toBe("#93c5fd");
  });

  it("usa a categoria SEM_DADOS quando o snapshot não contém o município", () => {
    expect(resolveMunicipioVisual("3209999", "Município ausente", frozenMap)).toMatchObject({
      cor: "#cccccc",
      textoAlternativo: "Município ausente: Sem evidência congelada",
      municipio: null,
    });
  });

  it("possui fallback neutro se nem a legenda de ausência estiver disponível", () => {
    expect(resolveMunicipioVisual("3209999", "Município ausente", { ...frozenMap, legenda: [] }).cor).toBe(COR_AUSENCIA_MAPA);
  });

  it("usa ausência segura e preserva o texto recebido para categoria desconhecida", () => {
    const unknownMap = {
      ...frozenMap,
      legenda: [...frozenMap.legenda, { codigo: "NOVA_CATEGORIA", rotulo: "Nova", cor: "#ff00ff", ordem: 4 }],
      municipios: [{ codigo_ibge: "3200102", nome: "Afonso Cláudio", categoria: "NOVA_CATEGORIA", valor: null, texto_alternativo: "Texto recebido para categoria futura" }],
    };
    expect(resolveMunicipioVisual("3200102", "", unknownMap)).toMatchObject({
      cor: "#cccccc",
      textoAlternativo: "Texto recebido para categoria futura",
    });
  });

  it("ignora discriminantes desconhecidos e aceita publicações antigas sem mapas", () => {
    const legacyMap = { ...frozenMap, schema_version: "1.0" as const };
    expect(mapasMunicipaisDoResultado({ mapas: [legacyMap, frozenMap, { ...frozenMap, schema_version: "2.0" }, { tipo: "GRAFICO" }] })).toEqual([legacyMap, frozenMap]);
    expect(mapasMunicipaisDoResultado({ totais: {} })).toEqual([]);
  });
});
