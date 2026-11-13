"use client";

import dynamic from "next/dynamic";
import { useEffect, useId, useMemo, useState } from "react";
import useSWR from "swr";

import type { MapaMunicipalCongelado } from "@/features/publicacoes/mapa/model";
import {
  isCategoriaMapaMunicipalConhecida,
  resolveMunicipioVisual,
} from "@/features/publicacoes/mapa/model";
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

  function selectMunicipality(code: string) {
    setSelectedCode(code);
    onSelecionarMunicipio?.(code);
  }

  if (presentationLayout) {
    return (
      <section className="grid h-full min-h-0 gap-5 lg:grid-cols-2" aria-labelledby={titleId}>
        <article className={`min-h-0 overflow-y-auto rounded-2xl border p-4 ${dark ? "border-slate-700 bg-slate-900" : "border-slate-300 bg-white shadow-md shadow-slate-300/50"}`}>
          <h4 id={titleId} className="sr-only">Municípios com informações na competência {mapa.competencia}</h4>
          <div className="space-y-5" aria-label="Municípios com informações" role="list">
            {municipalityGroups.map((group) => <section key={group.legend.codigo} role="listitem" aria-labelledby={`municipality-group-${group.legend.codigo}`}><h5 id={`municipality-group-${group.legend.codigo}`} className={`mb-2 flex items-center gap-2 border-b pb-2 text-sm font-semibold ${dark ? "border-slate-700 text-slate-100" : "border-slate-200 text-slate-800"}`}><span className="h-4 w-4 rounded-sm border border-black/10" style={{ backgroundColor: group.legend.cor }} aria-hidden="true" />{group.legend.rotulo}<span className={`ml-auto rounded-full px-2 py-0.5 text-xs ${dark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>{group.municipalities.length}</span></h5><ol className="grid grid-cols-1 gap-2 sm:grid-cols-2">{group.municipalities.map((item) => {
              const selectedItem = selectedCode === item.codigo_ibge;
              return <li key={item.codigo_ibge}><button type="button" aria-pressed={selectedItem} onClick={() => selectMunicipality(item.codigo_ibge)} className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition ${selectedItem ? dark ? "border-sky-400 bg-slate-800 ring-2 ring-sky-400" : "border-sky-600 bg-sky-50 ring-2 ring-sky-200" : dark ? "border-slate-700 bg-slate-950 hover:border-slate-500" : "border-slate-200 bg-slate-50 hover:border-slate-400"}`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${dark ? "bg-slate-700 text-white" : "bg-slate-800 text-white"}`}>{item.number}</span><strong className="min-w-0 truncate text-sm">{item.nome}</strong></button></li>;
            })}</ol></section>)}
            {numberedMunicipalities.length === 0 && <p className={`rounded-xl border border-dashed p-6 text-center text-sm ${dark ? "border-slate-700 text-slate-400" : "border-slate-300 text-slate-500"}`}>Nenhum município possui informação nesta competência.</p>}
          </div>
        </article>

        <article data-map-panel className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 text-slate-100 shadow-lg">
          <div className="min-h-0 flex-1 p-3">
            {isLoading && <div role="status" className="flex h-full items-center justify-center rounded-xl bg-slate-950 text-sm text-slate-300">Carregando limites municipais...</div>}
            {error && <div role="alert" className="flex h-full items-center justify-center rounded-xl border border-red-800 bg-red-950 p-4 text-sm text-red-100">Não foi possível carregar os limites municipais do Espírito Santo.</div>}
            {geojson && !error && <MapaLeaflet geojson={geojson} mapa={mapa} altura="100%" interativo={interativo} fundoEscuro numeracaoMunicipios={municipalityNumbers} codigoSelecionado={selectedCode} onSelecionar={selectMunicipality} />}
          </div>
          {selected && <p className="shrink-0 border-t border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200" aria-live="polite">{selected.textoAlternativo}</p>}
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
