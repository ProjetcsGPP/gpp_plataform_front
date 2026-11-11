"use client";

import { useState } from "react";
import useSWR from "swr";
import { BarChart3, FilterX } from "lucide-react";

import { AdminAlert, AdminPanel } from "@/components/admin/AdminPage";
import { Button } from "@/components/ui/button";
import { getTotaisHistoricosEdocs } from "@/features/publicacoes/edocs/mensal/api";
import { edocsMensalCacheKeys } from "@/features/publicacoes/edocs/mensal/cache";
import {
  formatCurrency,
  formatDecimal,
  formatDecimalUnit,
  formatInteger,
} from "@/features/publicacoes/edocs/mensal/metrics";
import type { TotaisHistoricosEdocsQuery } from "@/features/publicacoes/edocs/mensal/model";
import { usePermissions } from "@/hooks/usePermissions";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { PERMISSIONS } from "@/lib/permissions";

export function ColetaMensalEdocsHistoricalTotals() {
  const { can } = usePermissions();
  const [year, setYear] = useState("");
  const [municipalityId, setMunicipalityId] = useState("");
  const [query, setQuery] = useState<TotaisHistoricosEdocsQuery>({});
  const parsedYear = parseOptionalInteger(year);
  const parsedMunicipalityId = parseOptionalInteger(municipalityId);
  const yearIsValid = !year.trim() || (
    parsedYear !== undefined && parsedYear >= 2000 && parsedYear <= 9999
  );
  const municipalityIsValid = !municipalityId.trim() || (
    parsedMunicipalityId !== undefined && parsedMunicipalityId > 0
  );
  const allowed = can(PERMISSIONS.EDOCS_MENSAL_RESULTADO_PATRIARCA_VIEW);
  const key = allowed
    ? edocsMensalCacheKeys.totaisHistoricos([
        query.ano ?? null,
        query.patriarca_id ?? null,
      ])
    : null;
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    () => getTotaisHistoricosEdocs(query),
    { keepPreviousData: true, revalidateOnFocus: false },
  );

  if (!allowed) return null;

  function applyFilters() {
    if (!yearIsValid || !municipalityIsValid) return;
    setQuery({
      ano: parsedYear,
      patriarca_id: parsedMunicipalityId,
    });
  }

  function clearFilters() {
    setYear("");
    setMunicipalityId("");
    setQuery({});
  }

  return (
    <div data-testid="monthly-historical-totals">
      <AdminPanel className="relative p-5" aria-busy={isValidating}>
        {isValidating && data && (
          <div className="absolute inset-x-0 top-0 h-0.5 animate-pulse bg-app-primary" />
        )}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
              <BarChart3 aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-semibold text-slate-900">Totais históricos E-Docs</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-600">
                Somatórios das últimas revisões bem-sucedidas de cada competência, calculados pelo backend.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-xs font-medium text-slate-600">
            Ano (opcional)
            <input
              type="number"
              min={2000}
              max={9999}
              className="mt-1 block w-36 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              value={year}
              onChange={(event) => setYear(event.target.value)}
              aria-invalid={!yearIsValid}
            />
          </label>
          <label className="text-xs font-medium text-slate-600">
            ID interno do município (opcional)
            <input
              type="number"
              min={1}
              className="mt-1 block w-60 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              value={municipalityId}
              onChange={(event) => setMunicipalityId(event.target.value)}
              aria-invalid={!municipalityIsValid}
            />
          </label>
          <Button
            variant="outline"
            onClick={applyFilters}
            disabled={!yearIsValid || !municipalityIsValid || isValidating}
          >
            Aplicar filtros
          </Button>
          <Button variant="ghost" onClick={clearFilters} disabled={isValidating}>
            <FilterX aria-hidden="true" /> Limpar
          </Button>
        </div>
        {(!yearIsValid || !municipalityIsValid) && (
          <p className="mt-2 text-xs text-red-700">
            Informe um ano entre 2000 e 9999 e um ID de município inteiro positivo.
          </p>
        )}

        <div className="mt-5">
          {isLoading && (
            <p className="text-sm text-slate-500">Carregando totais históricos...</p>
          )}
          {error && (
            <AdminAlert>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>{getApiErrorMessage(error, "Não foi possível carregar os totais históricos.")}</span>
                <Button variant="outline" size="sm" onClick={() => mutate()}>
                  Tentar novamente
                </Button>
              </div>
            </AdminAlert>
          )}
          {data && <HistoricalTotalsResult data={data} />}
        </div>
      </AdminPanel>
    </div>
  );
}

function HistoricalTotalsResult({
  data,
}: {
  data: Awaited<ReturnType<typeof getTotaisHistoricosEdocs>>;
}) {
  const municipality = data.nome_municipio
    ? `${data.nome_municipio}${data.codigo_municipio ? ` (${data.codigo_municipio})` : ""}`
    : "Todos os municípios";
  return (
    <div>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-600">
        <span><strong>Período:</strong> {data.ano ?? "Todos os anos"}</span>
        <span><strong>Município:</strong> {municipality}</span>
        <span>
          <strong>Versões:</strong>{" "}
          {data.versoes_calculo.length ? data.versoes_calculo.join(", ") : "Não informado"}
        </span>
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <HistoricalItem label="Competências" value={formatInteger(data.quantidade_competencias)} />
        <HistoricalItem label="Municípios" value={formatInteger(data.quantidade_municipios)} />
        <HistoricalItem label="Processos" value={formatInteger(data.total_processos)} />
        <HistoricalItem label="Documentos" value={formatInteger(data.total_documentos)} />
        <HistoricalItem label="Páginas" value={formatInteger(data.total_paginas)} />
        <HistoricalItem label="Papel economizado" value={formatDecimalUnit(data.economia_papel_kg, "kg", 5)} />
        <HistoricalItem label="Gases evitados" value={formatDecimalUnit(data.gases_poluentes_kg, "kg", 4)} />
        <HistoricalItem label="Água economizada" value={formatDecimalUnit(data.economia_agua_m3, "m³", 2)} />
        <HistoricalItem label="Árvores salvas" value={formatDecimal(data.arvores_salvas, 4)} />
        <HistoricalItem label="Economia com papel" value={formatCurrency(data.economia_papel_reais)} />
        <HistoricalItem label="Economia com insumos" value={formatCurrency(data.economia_insumos_reais)} />
        <HistoricalItem label="Economia com impressão" value={formatCurrency(data.economia_impressao_reais)} />
        <HistoricalItem label="Economia total" value={formatCurrency(data.economia_total_reais)} />
      </dl>
    </div>
  );
}

function HistoricalItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function parseOptionalInteger(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
}
