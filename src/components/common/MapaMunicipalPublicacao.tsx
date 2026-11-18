"use client";

import dynamic from "next/dynamic";
import { useEffect, useId, useMemo, useState } from "react";
import useSWR from "swr";

import type { MapaMunicipalCongelado } from "@/features/publicacoes/mapa/model";
import type { IndicadoresEdocsMunicipio } from "@/features/publicacoes/mapa/model";
import {
  isCategoriaMapaMunicipalConhecida,
  resolveMunicipioVisual,
} from "@/features/publicacoes/mapa/model";
import { formatPublicValue } from "@/features/publicacoes/publico/presentationFormat";
import { debugLog } from "@/lib/debug";
import type { MunicipiosGeoJson } from "./MapaMunicipalLeaflet";

const MapaLeaflet = dynamic(() => import("./MapaMunicipalLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="flex h-96 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">
      Preparando visualização do mapa...
    </div>
  ),
});

const MUNICIPIOS_GEOJSON_URL = "/data/geojs-32-mun.json";

type MunicipalityListDensity = "comfortable" | "compact" | "dense";

export function resolveMunicipalityListDensity(count: number): MunicipalityListDensity {
  if (count >= 20) return "dense";
  if (count >= 10) return "compact";
  return "comfortable";
}

const MUNICIPALITY_LIST_STYLES: Record<MunicipalityListDensity, {
  groups: string;
  heading: string;
  swatch: string;
  count: string;
  list: string;
  button: string;
  number: string;
  name: string;
}> = {
  comfortable: {
    groups: "space-y-5",
    heading: "mb-2 gap-2 pb-2 text-sm",
    swatch: "h-4 w-4",
    count: "px-2 py-0.5 text-xs",
    list: "grid-cols-1 gap-2 sm:grid-cols-2",
    button: "gap-2 rounded-lg px-2.5 py-2",
    number: "h-7 w-7 text-xs",
    name: "text-sm",
  },
  compact: {
    groups: "space-y-3",
    heading: "mb-1.5 gap-1.5 pb-1.5 text-xs",
    swatch: "h-3.5 w-3.5",
    count: "px-1.5 py-0.5 text-[11px]",
    list: "grid-cols-2 gap-1.5",
    button: "gap-1.5 rounded-md px-2 py-1.5",
    number: "h-6 w-6 text-[10px]",
    name: "text-xs",
  },
  dense: {
    groups: "space-y-2",
    heading: "mb-1 gap-1 pb-1 text-[11px]",
    swatch: "h-3 w-3",
    count: "px-1.5 py-0 text-[10px]",
    list: "grid-cols-2 gap-1 xl:grid-cols-3",
    button: "gap-1 rounded-md px-1.5 py-1",
    number: "h-5 w-5 text-[9px]",
    name: "text-[11px] leading-tight",
  },
};

const EDOCS_MUNICIPAL_METRICS = [
  { key: "total_processos", label: "Processos", unit: null, precision: 0 },
  { key: "total_documentos", label: "Documentos", unit: null, precision: 0 },
  { key: "total_paginas", label: "Páginas em PDF", unit: null, precision: 0 },
  { key: "economia_papel_kg", label: "Economia de papel", unit: "kg", precision: 2 },
  { key: "gases_poluentes_kg", label: "Redução de CO₂", unit: "kg", precision: 2 },
  { key: "economia_agua_m3", label: "Economia de água", unit: "m³", precision: 2 },
  { key: "arvores_salvas", label: "Árvores preservadas", unit: null, precision: 2 },
  { key: "economia_papel_reais", label: "Economia com papel", unit: "BRL", precision: 2 },
  { key: "economia_insumos_reais", label: "Economia com insumos", unit: "BRL", precision: 2 },
  { key: "economia_impressao_reais", label: "Economia com impressão", unit: "BRL", precision: 2 },
  { key: "economia_total_reais", label: "Economia total", unit: "BRL", precision: 2 },
] as const satisfies ReadonlyArray<{
  key: keyof IndicadoresEdocsMunicipio;
  label: string;
  unit: string | null;
  precision: number;
}>;

function formatMunicipalMetric(
  data: IndicadoresEdocsMunicipio | undefined,
  metric: (typeof EDOCS_MUNICIPAL_METRICS)[number],
) {
  return formatPublicValue(data?.[metric.key], metric.unit, metric.precision);
}

function formatEflowCount(value: string | number | null | undefined) {
  return formatPublicValue(value, null, 0);
}

function formatEflowPercentage(value: string | number | null | undefined) {
  return formatPublicValue(value, "%", 2);
}

async function loadMunicipiosGeoJson(url: string): Promise<MunicipiosGeoJson> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<MunicipiosGeoJson>;
}

interface MapaMunicipalPublicacaoProps {
  mapa: MapaMunicipalCongelado;
  altura?: number | string;
  interativo?: boolean;
  exibirDetalhesTecnicos?: boolean;
  onSelecionarMunicipio?: (codigoIbge: string) => void;
  dark?: boolean;
  compact?: boolean;
  presentationLayout?: boolean;
}

export function MapaMunicipalPublicacao({
  mapa,
  altura = 520,
  interativo = true,
  exibirDetalhesTecnicos = false,
  onSelecionarMunicipio,
  dark = false,
  compact = false,
  presentationLayout = false,
}: MapaMunicipalPublicacaoProps) {
  const titleId = useId();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const { data: geojson, error, isLoading } = useSWR<MunicipiosGeoJson>(
    MUNICIPIOS_GEOJSON_URL,
    loadMunicipiosGeoJson,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );
  useEffect(() => {
    const unknownCategories = [...new Set(
      mapa.municipios
        .map((item) => item.categoria)
        .filter((category) => !isCategoriaMapaMunicipalConhecida(category)),
    )];
    if (unknownCategories.length) {
      debugLog("publicacoes", "categorias municipais desconhecidas no mapa congelado", {
        indicador: mapa.indicador,
        schema_version: mapa.schema_version,
        categorias: unknownCategories,
      });
    }
  }, [mapa]);
  useEffect(() => {
    if (!geojson) return;
    const geoCodes = new Set(
      geojson.features.map((feature) => String(feature.properties?.id ?? "")),
    );
    const unmatchedCodes = mapa.municipios
      .map((item) => item.codigo_ibge)
      .filter((code) => !geoCodes.has(code));
    if (unmatchedCodes.length) {
      debugLog("publicacoes", "codigos IBGE do mapa sem geometria local", {
        indicador: mapa.indicador,
        schema_version: mapa.schema_version,
        codigos_ibge: unmatchedCodes,
      });
    }
  }, [geojson, mapa]);

  const rows = useMemo(() => {
    if (!geojson) return [];
    return geojson.features
      .map((feature) => resolveMunicipioVisual(
        String(feature.properties?.id ?? ""),
        feature.properties?.name || "Município não identificado",
        mapa,
      ))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [geojson, mapa]);
  const selected = rows.find((item) => item.codigoIbge === selectedCode) ?? null;
  const municipalityGroups = useMemo(() => {
    let nextNumber = 1;
    return mapa.legenda
      .filter((legend) => legend.codigo !== "SEM_DADOS")
      .sort((left, right) => left.ordem - right.ordem)
      .map((legend) => ({
        legend,
        municipalities: mapa.municipios
          .filter((item) => item.categoria === legend.codigo)
          .sort((left, right) => left.nome.localeCompare(right.nome, "pt-BR"))
          .map((item) => ({ ...item, number: nextNumber++ })),
      }))
      .filter((group) => group.municipalities.length > 0);
  }, [mapa.legenda, mapa.municipios]);
  const numberedMunicipalities = useMemo(
    () => municipalityGroups.flatMap((group) => group.municipalities),
    [municipalityGroups],
  );
  const municipalityNumbers = useMemo(
    () => Object.fromEntries(numberedMunicipalities.map((item) => [item.codigo_ibge, item.number])),
    [numberedMunicipalities],
  );
  const listDensity = resolveMunicipalityListDensity(numberedMunicipalities.length);
  const listStyles = MUNICIPALITY_LIST_STYLES[listDensity];
  const selectedLegend = selected?.municipio
    ? mapa.legenda.find((item) => item.codigo === selected.municipio?.categoria) ?? null
    : null;
  const selectedNumber = selectedCode ? municipalityNumbers[selectedCode] : null;

  function selectMunicipality(code: string) {
    setSelectedCode(code);
    onSelecionarMunicipio?.(code);
  }

  if (presentationLayout) {
    return (
      <section className="grid h-full min-h-0 gap-5 lg:grid-cols-2" aria-labelledby={titleId}>
        <article className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border p-4 ${dark ? "border-slate-700 bg-slate-900" : "border-slate-300 bg-white shadow-md shadow-slate-300/50"}`}>
          <h4 id={titleId} className="sr-only">Municípios com informações na competência {mapa.competencia}</h4>
          <div
            className={`min-h-0 flex-[0.9] overflow-y-auto pr-1 ${listStyles.groups}`}
            aria-label="Municípios com informações"
            data-density={listDensity}
            role="list"
          >
            {municipalityGroups.map((group) => (
              <section key={group.legend.codigo} role="listitem" aria-labelledby={`municipality-group-${group.legend.codigo}`}>
                <h5
                  id={`municipality-group-${group.legend.codigo}`}
                  className={`flex items-center border-b font-semibold ${listStyles.heading} ${dark ? "border-slate-700 text-slate-100" : "border-slate-200 text-slate-800"}`}
                >
                  <span className={`rounded-sm border border-black/10 ${listStyles.swatch}`} style={{ backgroundColor: group.legend.cor }} aria-hidden="true" />
                  {group.legend.rotulo}
                  <span className={`ml-auto rounded-full ${listStyles.count} ${dark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>{group.municipalities.length}</span>
                </h5>
                <ol className={`grid ${listStyles.list}`}>
                  {group.municipalities.map((item) => {
                    const selectedItem = selectedCode === item.codigo_ibge;
                    return (
                      <li key={item.codigo_ibge}>
                        <button
                          type="button"
                          aria-pressed={selectedItem}
                          onClick={() => selectMunicipality(item.codigo_ibge)}
                          className={`flex w-full items-center border text-left transition ${listStyles.button} ${selectedItem ? dark ? "border-sky-400 bg-slate-800 ring-2 ring-sky-400" : "border-sky-600 bg-sky-50 ring-2 ring-sky-200" : dark ? "border-slate-700 bg-slate-950 hover:border-slate-500" : "border-slate-200 bg-slate-50 hover:border-slate-400"}`}
                        >
                          <span className={`flex shrink-0 items-center justify-center rounded-full font-bold ${listStyles.number} ${dark ? "bg-slate-700 text-white" : "bg-slate-800 text-white"}`}>{item.number}</span>
                          <strong className={`min-w-0 truncate ${listStyles.name}`}>{item.nome}</strong>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))}
            {numberedMunicipalities.length === 0 && <p className={`rounded-xl border border-dashed p-6 text-center text-sm ${dark ? "border-slate-700 text-slate-400" : "border-slate-300 text-slate-500"}`}>Nenhum município possui informação nesta competência.</p>}
          </div>

          <section
            className={`mt-4 flex min-h-0 flex-[1.1] flex-col border-t pt-4 ${dark ? "border-slate-700" : "border-slate-200"}`}
            aria-label="Informações do município selecionado"
            aria-live="polite"
          >
            <h5 className={`mb-3 text-sm font-semibold uppercase tracking-wide ${dark ? "text-slate-300" : "text-slate-600"}`}>
              Informações do município
            </h5>
            {selected ? (
              <div className={`flex min-h-0 flex-1 flex-col rounded-xl border p-4 ${dark ? "border-slate-700 bg-slate-950" : "border-slate-200 bg-slate-50"}`}>
                <div className="flex items-start gap-3">
                  {selectedNumber && (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-white">
                      {selectedNumber}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-base">{selected.nome}</strong>
                      {selectedLegend && (
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${dark ? "bg-slate-800 text-slate-200" : "bg-white text-slate-700"}`}>
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: selectedLegend.cor }} aria-hidden="true" />
                          {selectedLegend.rotulo}
                        </span>
                      )}
                    </div>
                    <p className={`mt-1 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                      Competência {mapa.competencia}
                    </p>
                  </div>
                </div>
                <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-auto pr-1">
                  <p className={`border-t pt-3 text-sm leading-relaxed ${dark ? "border-slate-800 text-slate-200" : "border-slate-200 text-slate-700"}`}>
                    {selected.textoAlternativo}
                  </p>
                  {selected.municipio?.edocs && (
                    <section aria-labelledby={`${titleId}-edocs`}>
                      <h6 id={`${titleId}-edocs`} className={`mb-2 text-sm font-semibold ${dark ? "text-slate-200" : "text-slate-700"}`}>Indicadores E-Docs</h6>
                      <div className={`rounded-lg border ${dark ? "border-slate-800" : "border-slate-200"}`}>
                    <table className="w-full border-collapse text-left text-xs">
                      <caption className="sr-only">Indicadores E-Docs de {selected.nome} na competência e acumulados</caption>
                      <thead className={`sticky top-0 z-10 ${dark ? "bg-slate-800 text-slate-200" : "bg-slate-200 text-slate-700"}`}>
                        <tr>
                          <th className="px-3 py-2 font-semibold">Indicador</th>
                          <th className="px-3 py-2 text-right font-semibold">No mês</th>
                          <th className="px-3 py-2 text-right font-semibold">Acumulado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {EDOCS_MUNICIPAL_METRICS.map((metric) => (
                          <tr key={metric.key} className={dark ? "border-t border-slate-800" : "border-t border-slate-200"}>
                            <th scope="row" className={`px-3 py-2 font-medium ${dark ? "text-slate-300" : "text-slate-600"}`}>{metric.label}</th>
                            <td className="whitespace-nowrap px-3 py-2 text-right font-semibold">{formatMunicipalMetric(selected.municipio?.edocs?.mes, metric)}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-right font-semibold">{formatMunicipalMetric(selected.municipio?.edocs?.acumulado, metric)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {selected.municipio.edocs.acumulado?.competencias_consideradas !== undefined && (
                      <p className={`border-t px-3 py-2 text-xs ${dark ? "border-slate-800 bg-slate-900 text-slate-400" : "border-slate-200 bg-white text-slate-500"}`}>
                        Acumulado de {formatPublicValue(selected.municipio.edocs.acumulado.competencias_consideradas, null, 0)} competências.
                      </p>
                    )}
                      </div>
                    </section>
                  )}
                  {selected.municipio?.eflow && (
                    <section aria-labelledby={`${titleId}-eflow`}>
                      <h6 id={`${titleId}-eflow`} className={`mb-2 text-sm font-semibold ${dark ? "text-slate-200" : "text-slate-700"}`}>Indicadores E-Flow</h6>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          ["Fluxos", selected.municipio.eflow.quantidade_fluxos],
                          ["Órgãos", selected.municipio.eflow.quantidade_orgaos_participantes],
                          ["Setores ativos", selected.municipio.eflow.quantidade_setores_ativos],
                        ].map(([label, value]) => (
                          <div key={String(label)} className={`rounded-lg border px-2 py-3 text-center ${dark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
                            <strong className="block text-base">{formatEflowCount(value)}</strong>
                            <span className={`text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>{label}</span>
                          </div>
                        ))}
                      </div>
                      {!!selected.municipio.eflow.orgaos_maior_quantidade_fluxos?.length && (
                        <div className={`mt-2 rounded-lg border p-3 ${dark ? "border-slate-800" : "border-slate-200"}`}>
                          <h6 className={`mb-2 text-xs font-semibold uppercase tracking-wide ${dark ? "text-slate-400" : "text-slate-500"}`}>Órgãos com mais fluxos</h6>
                          <ol className="space-y-1.5">
                            {selected.municipio.eflow.orgaos_maior_quantidade_fluxos.map((item, index) => (
                              <li key={`${item.patriarca ?? ""}-${item.orgao}-${index}`} className="flex items-center gap-2 text-xs">
                                <span className={`min-w-0 flex-1 truncate ${dark ? "text-slate-300" : "text-slate-700"}`}>{item.orgao}</span>
                                <strong>{formatEflowCount(item.quantidade_fluxos)}</strong>
                                <span className={`w-16 text-right ${dark ? "text-slate-400" : "text-slate-500"}`}>{formatEflowPercentage(item.percentual)}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                      {!!selected.municipio.eflow.distribuicao_publico_alvo?.length && (
                        <div className={`mt-2 rounded-lg border p-3 ${dark ? "border-slate-800" : "border-slate-200"}`}>
                          <h6 className={`mb-2 text-xs font-semibold uppercase tracking-wide ${dark ? "text-slate-400" : "text-slate-500"}`}>Distribuição por público-alvo</h6>
                          <ul className="space-y-1.5">
                            {selected.municipio.eflow.distribuicao_publico_alvo.map((item) => (
                              <li key={item.publico_alvo} className="flex items-center gap-2 text-xs">
                                <span className={`min-w-0 flex-1 truncate ${dark ? "text-slate-300" : "text-slate-700"}`}>{item.publico_alvo}</span>
                                <strong>{formatEflowCount(item.quantidade_fluxos)}</strong>
                                <span className={`w-16 text-right ${dark ? "text-slate-400" : "text-slate-500"}`}>{formatEflowPercentage(item.percentual)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </section>
                  )}
                  {!selected.municipio?.edocs && !selected.municipio?.eflow && (
                    <p className={`rounded-lg border border-dashed px-3 py-3 text-center text-xs ${dark ? "border-slate-700 text-slate-400" : "border-slate-300 text-slate-500"}`}>
                      Esta publicação não possui indicadores E-Docs ou E-Flow para o município.
                    </p>
                  )}
                  </div>
              </div>
            ) : (
              <p className={`rounded-xl border border-dashed px-4 py-5 text-center text-sm ${dark ? "border-slate-700 text-slate-400" : "border-slate-300 text-slate-500"}`}>
                Selecione um município na lista ou no mapa para consultar suas informações.
              </p>
            )}
          </section>
        </article>

        <article data-map-panel className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 text-slate-100 shadow-lg">
          <div className="min-h-0 flex-1 p-3">
            {isLoading && <div role="status" className="flex h-full items-center justify-center rounded-xl bg-slate-950 text-sm text-slate-300">Carregando limites municipais...</div>}
            {error && <div role="alert" className="flex h-full items-center justify-center rounded-xl border border-red-800 bg-red-950 p-4 text-sm text-red-100">Não foi possível carregar os limites municipais do Espírito Santo.</div>}
            {geojson && !error && <MapaLeaflet geojson={geojson} mapa={mapa} altura="100%" interativo={interativo} fundoEscuro numeracaoMunicipios={municipalityNumbers} codigoSelecionado={selectedCode} onSelecionar={selectMunicipality} />}
          </div>
          <ul className="flex shrink-0 flex-wrap justify-center gap-x-4 gap-y-1 border-t border-slate-700 bg-slate-900 px-4 py-2 text-xs text-slate-200" aria-label="Legenda do mapa">
            {mapa.legenda.filter((item) => item.codigo !== "SEM_DADOS").map((item) => <li key={item.codigo} className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-white/40" style={{ backgroundColor: item.cor }} aria-hidden="true" />{item.rotulo}</li>)}
          </ul>
          <table className="sr-only"><caption>Dados municipais do mapa</caption><tbody>{rows.map((row) => <tr key={row.codigoIbge}><td>{row.nome}</td><td>{row.textoAlternativo}</td></tr>)}</tbody></table>
        </article>
      </section>
    );
  }

  return (
    <section className={`h-full overflow-hidden rounded-xl border p-4 ${dark ? "border-slate-700 bg-slate-900 text-slate-100" : "border-slate-200 bg-white text-slate-950"}`} aria-labelledby={titleId}>
      <div className="mb-4">
        <h4 id={titleId} className="text-base font-semibold">{mapa.titulo}</h4>
        <p className={`text-sm ${dark ? "text-slate-300" : "text-slate-600"}`}>Competência {mapa.competencia}</p>
      </div>

      <ul className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Legenda do mapa">
        {mapa.legenda.map((item) => (
          <li key={item.codigo} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm border border-black/10" style={{ backgroundColor: item.cor }} aria-hidden="true" />
            {item.rotulo}
          </li>
        ))}
      </ul>

      {isLoading && <div role="status" className="flex h-96 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">Carregando limites municipais...</div>}
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Não foi possível carregar os limites municipais do Espírito Santo.</div>}
      {geojson && !error && <MapaLeaflet geojson={geojson} mapa={mapa} altura={altura} interativo={interativo} codigoSelecionado={selectedCode} onSelecionar={selectMunicipality} />}

      {selected && <p className={`mt-3 rounded-lg px-3 py-2 text-sm ${dark ? "bg-slate-800" : "bg-slate-50"}`} aria-live="polite">{selected.textoAlternativo}</p>}

      {!compact && <details className="mt-4">
        <summary className={`cursor-pointer text-sm font-medium ${dark ? "text-slate-300" : "text-slate-700"}`}>Consultar dados municipais em tabela</summary>
        <div className="mt-2 max-h-80 overflow-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-100"><tr><th className="p-2">Município</th><th className="p-2">Informação</th></tr></thead>
            <tbody>{rows.map((row) => <tr key={row.codigoIbge} className="border-t"><td className="p-2 font-medium">{row.nome}</td><td className="p-2">{row.textoAlternativo}</td></tr>)}</tbody>
          </table>
        </div>
      </details>}

      {compact && <table className="sr-only"><caption>Dados municipais do mapa</caption><tbody>{rows.map((row) => <tr key={row.codigoIbge}><td>{row.nome}</td><td>{row.textoAlternativo}</td></tr>)}</tbody></table>}

      {exibirDetalhesTecnicos && <details className="mt-3 text-xs text-slate-600"><summary className="cursor-pointer font-medium">Proveniência do mapa</summary><pre className="mt-2 overflow-auto rounded-lg bg-slate-950 p-3 text-slate-100">{JSON.stringify(mapa.proveniencia, null, 2)}</pre></details>}
    </section>
  );
}
