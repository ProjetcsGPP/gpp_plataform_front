"use client";

import { useState, type Key, type ReactNode } from "react";
import useSWR from "swr";

import {
  AdminDataTable,
  type AdminTableColumn,
} from "@/components/admin/AdminDataTable";
import { AdminAlert, AdminPanel } from "@/components/admin/AdminPage";
import { Button } from "@/components/ui/button";
import {
  EdocsModal,
  EdocsTextFilter,
} from "@/features/publicacoes/edocs/EdocsUi";
import {
  getTotaisResultadosMensaisPatriarcasEdocs,
  listAuditoriaColetasMensaisEdocs,
  listFontesBrutasColetasMensaisEdocs,
  listResultadosMensaisOrganizacoesEdocs,
  listResultadosMensaisPatriarcasEdocs,
} from "@/features/publicacoes/edocs/mensal/api";
import { edocsMensalCacheKeys } from "@/features/publicacoes/edocs/mensal/cache";
import type {
  ColetaMensalEdocs,
  EventoAuditoriaColetaMensalEdocs,
  FonteBrutaColetaMensalEdocs,
  MonthlyDetailQuery,
  PaginatedResponse,
  ResultadoMensalOrganizacaoEdocs,
  ResultadoMensalPatriarcaEdocs,
  TipoEventoColetaMensalEdocs,
} from "@/features/publicacoes/edocs/mensal/model";
import {
  formatCurrency,
  formatDecimal,
  formatDecimalUnit,
  formatInteger,
} from "@/features/publicacoes/edocs/mensal/metrics";
import {
  formatCompetence,
  MonthlyStatus,
} from "@/features/publicacoes/edocs/mensal/ui";
import {
  edocsOrdering,
  nextEdocsSorting,
} from "@/features/publicacoes/edocs/table";
import { formatAdminDate } from "@/lib/adminResource";
import { getApiErrorMessage } from "@/lib/apiErrors";
import type { AdminSortRule, AdminTableDensity } from "@/types/admin";

type DetailTab = "resumo" | "patriarcas" | "organizacoes" | "fontes" | "auditoria";

export function ColetaMensalEdocsDetails({
  coleta,
  canViewPatriarcas,
  canViewOrganizacoes,
  canViewFontes,
  canViewAudit,
  onClose,
}: {
  coleta: ColetaMensalEdocs;
  canViewPatriarcas: boolean;
  canViewOrganizacoes: boolean;
  canViewFontes: boolean;
  canViewAudit: boolean;
  onClose: () => void;
}) {
  const tabs: Array<{ key: DetailTab; label: string }> = [
    { key: "resumo", label: "Resumo" },
    ...(canViewPatriarcas ? [{ key: "patriarcas" as const, label: "Municípios" }] : []),
    ...(canViewOrganizacoes ? [{ key: "organizacoes" as const, label: "Organizações" }] : []),
    ...(canViewFontes ? [{ key: "fontes" as const, label: "Fontes" }] : []),
    ...(canViewAudit ? [{ key: "auditoria" as const, label: "Auditoria" }] : []),
  ];
  const [activeTab, setActiveTab] = useState<DetailTab>("resumo");

  return (
    <EdocsModal
      title={`Coleta E-Docs — ${formatCompetence(coleta.ano, coleta.mes)} · revisão ${coleta.revisao}`}
      onClose={onClose}
      extraWide
    >
      <div className="mt-5 border-b border-slate-200" role="tablist" aria-label="Detalhes da coleta mensal">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`rounded-t-md px-4 py-2 text-sm font-medium ${
                activeTab === tab.key
                  ? "bg-app-primary text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5" role="tabpanel">
        {activeTab === "resumo" && (
          <MonthlySummary
            coleta={coleta}
            canViewTotals={canViewPatriarcas}
          />
        )}
        {activeTab === "patriarcas" && canViewPatriarcas && (
          <PatriarchResults coletaId={coleta.id} />
        )}
        {activeTab === "organizacoes" && canViewOrganizacoes && (
          <OrganizationResults coletaId={coleta.id} />
        )}
        {activeTab === "fontes" && canViewFontes && (
          <RawSources coletaId={coleta.id} />
        )}
        {activeTab === "auditoria" && canViewAudit && (
          <MonthlyAudit coletaId={coleta.id} />
        )}
      </div>
    </EdocsModal>
  );
}

function MonthlySummary({
  coleta,
  canViewTotals,
}: {
  coleta: ColetaMensalEdocs;
  canViewTotals: boolean;
}) {
  return (
    <div className="space-y-5">
      {coleta.situacao === "SOLICITADA" && (
        <AdminAlert>
          A solicitação foi registrada, mas a execução ainda não começou.
        </AdminAlert>
      )}
      {coleta.situacao === "EXECUTANDO" && (
        <AdminAlert>
          A coleta está sendo processada. Os dados serão atualizados periodicamente.
        </AdminAlert>
      )}
      {coleta.situacao === "ERRO" && (
        <AdminAlert variant="error">
          <strong>{coleta.codigo_erro || "COLETA_COM_ERRO"}:</strong>{" "}
          {coleta.mensagem_erro || "A coleta foi encerrada com erro funcional."}
        </AdminAlert>
      )}
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryItem label="Competência" value={formatCompetence(coleta.ano, coleta.mes)} />
        <SummaryItem label="Revisão" value={String(coleta.revisao)} />
        <SummaryItem label="Ambiente" value={coleta.ambiente} />
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <dt className="text-xs font-semibold uppercase text-slate-500">Situação</dt>
          <dd className="mt-2"><MonthlyStatus status={coleta.situacao} /></dd>
        </div>
        <SummaryItem label="Início" value={formatNullableDate(coleta.iniciada_em)} />
        <SummaryItem label="Conclusão" value={formatNullableDate(coleta.concluida_em)} />
        <SummaryItem label="Patriarcas" value={coleta.quantidade_patriarcas.toLocaleString("pt-BR")} />
        <SummaryItem label="Organizações" value={coleta.quantidade_organizacoes.toLocaleString("pt-BR")} />
        <SummaryItem label="Fontes brutas" value={coleta.quantidade_fontes_brutas.toLocaleString("pt-BR")} />
        <SummaryItem label="Solicitada por" value={coleta.criado_por_nome || "Sistema"} />
        <SummaryItem label="Solicitada em" value={formatAdminDate(coleta.criado_em)} />
      </dl>
      {coleta.situacao === "SUCESSO" && canViewTotals && (
        <MonthlyTotals coletaId={coleta.id} />
      )}
      <AdminPanel className="p-4">
        <h3 className="font-semibold text-slate-900">Patriarcas congelados nesta revisão</h3>
        <p className="mt-1 text-sm text-slate-600">
          Esta seleção pertence ao snapshot e não acompanha alterações posteriores do catálogo.
        </p>
        {coleta.patriarcas_solicitados.length ? (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {coleta.patriarcas_solicitados.map((patriarca) => (
              <li key={patriarca.id} className="rounded-md border border-slate-200 px-3 py-2 text-sm">
                <strong>{patriarca.sigla}</strong>
                <span className="ml-2 text-slate-600">{patriarca.nome}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-500">Nenhum patriarca registrado no snapshot.</p>
        )}
      </AdminPanel>
      <AdminAlert>
        Esta coleta é independente de publicação e não executa aprovação ou disponibilização pública.
      </AdminAlert>
    </div>
  );
}

function MonthlyTotals({ coletaId }: { coletaId: string }) {
  const key = edocsMensalCacheKeys.totaisPatriarcas(coletaId);
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    () => getTotaisResultadosMensaisPatriarcasEdocs(coletaId),
    { keepPreviousData: true, revalidateOnFocus: false },
  );

  if (isLoading) {
    return <AdminPanel className="p-4 text-sm text-slate-500">Carregando consolidado dos municípios...</AdminPanel>;
  }
  if (error) {
    return (
      <AdminAlert>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>{getApiErrorMessage(error, "Não foi possível carregar o consolidado dos municípios.")}</span>
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            Tentar novamente
          </Button>
        </div>
      </AdminAlert>
    );
  }
  if (!data) return null;

  return (
    <AdminPanel className="relative p-4" aria-busy={isValidating}>
      {isValidating && (
        <div className="absolute inset-x-0 top-0 h-0.5 animate-pulse bg-app-primary" />
      )}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-900">Consolidado de todos os municípios</h3>
          <p className="mt-1 text-sm text-slate-600">
            Totais canônicos da revisão completa, independentes da paginação da tabela.
          </p>
        </div>
        <span className="text-xs text-slate-500">Cálculo: {data.versao_calculo}</span>
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryItem label="Municípios" value={formatInteger(data.quantidade_municipios)} />
        <SummaryItem label="Processos" value={formatInteger(data.total_processos)} />
        <SummaryItem label="Documentos" value={formatInteger(data.total_documentos)} />
        <SummaryItem label="Páginas" value={formatInteger(data.total_paginas)} />
        <SummaryItem label="Papel economizado" value={formatDecimalUnit(data.economia_papel_kg, "kg", 5)} />
        <SummaryItem label="Gases poluentes evitados" value={formatDecimalUnit(data.gases_poluentes_kg, "kg", 4)} />
        <SummaryItem label="Água economizada" value={formatDecimalUnit(data.economia_agua_m3, "m³", 2)} />
        <SummaryItem label="Árvores salvas" value={formatDecimal(data.arvores_salvas, 4)} />
        <SummaryItem label="Economia com papel" value={formatCurrency(data.economia_papel_reais)} />
        <SummaryItem label="Economia com insumos" value={formatCurrency(data.economia_insumos_reais)} />
        <SummaryItem label="Economia com impressão" value={formatCurrency(data.economia_impressao_reais)} />
        <SummaryItem label="Economia total" value={formatCurrency(data.economia_total_reais)} />
      </dl>
    </AdminPanel>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function PatriarchResults({ coletaId }: { coletaId: string }) {
  type SortKey = "sigla_patriarca" | "nome_patriarca" | "total_processos";
  const columns: AdminTableColumn<ResultadoMensalPatriarcaEdocs, SortKey>[] = [
    { key: "sigla", label: "Sigla", sortKey: "sigla_patriarca", render: (row) => <strong>{row.sigla_patriarca}</strong> },
    { key: "nome", label: "Município", sortKey: "nome_patriarca", render: (row) => row.nome_patriarca },
    { key: "municipio", label: "Código municipal", render: (row) => formatNullableMetric(row.codigo_municipio) },
    { key: "processos", label: "Processos", sortKey: "total_processos", render: (row) => formatNullableMetric(row.total_processos) },
    { key: "documentos", label: "Documentos", render: (row) => formatNullableMetric(row.total_documentos) },
    { key: "paginas", label: "Páginas", render: (row) => formatNullableMetric(row.total_paginas) },
    {
      key: "ambientais",
      label: "Indicadores ambientais",
      render: (row) => (
        <MetricList
          items={[
            ["Papel", formatDecimalUnit(row.economia_papel_kg, "kg", 5)],
            ["Gases", formatDecimalUnit(row.gases_poluentes_kg, "kg", 4)],
            ["Água", formatDecimalUnit(row.economia_agua_m3, "m³", 2)],
            ["Árvores", formatDecimal(row.arvores_salvas, 4)],
          ]}
        />
      ),
    },
    {
      key: "financeiros",
      label: "Indicadores financeiros",
      render: (row) => (
        <MetricList
          items={[
            ["Papel", formatCurrency(row.economia_papel_reais)],
            ["Insumos", formatCurrency(row.economia_insumos_reais)],
            ["Impressão", formatCurrency(row.economia_impressao_reais)],
            ["Total", formatCurrency(row.economia_total_reais)],
          ]}
        />
      ),
    },
    { key: "versao", label: "Versão do cálculo", render: (row) => row.versao_calculo },
  ];
  return (
    <DetailTable
      coletaId={coletaId}
      cacheKey={edocsMensalCacheKeys.patriarcas}
      load={listResultadosMensaisPatriarcasEdocs}
      columns={columns}
      getRowKey={(row) => row.id}
      initialSorting={[{ key: "sigla_patriarca", direction: "asc" }]}
      emptyMessage="Nenhum resultado por município disponível."
      errorMessage="Não foi possível carregar os resultados por município."
    />
  );
}

function MetricList({ items }: { items: Array<[string, string]> }) {
  return (
    <dl className="min-w-48 space-y-1 text-xs">
      {items.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-3">
          <dt className="text-slate-500">{label}</dt>
          <dd className="font-medium text-slate-800">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function OrganizationResults({ coletaId }: { coletaId: string }) {
  type SortKey = "nome_organizacao" | "nome_patriarca" | "total_processos";
  const columns: AdminTableColumn<ResultadoMensalOrganizacaoEdocs, SortKey>[] = [
    {
      key: "organizacao",
      label: "Organização",
      sortKey: "nome_organizacao",
      render: (row) => <div><strong>{row.nome_organizacao}</strong><span className="block text-xs text-slate-500">{row.id_organizacao_externo}</span></div>,
    },
    { key: "patriarca", label: "Patriarca", sortKey: "nome_patriarca", render: (row) => row.nome_patriarca },
    { key: "processos", label: "Processos", sortKey: "total_processos", render: (row) => formatNullableMetric(row.total_processos) },
    { key: "documentos", label: "Documentos", render: (row) => formatNullableMetric(row.total_documentos) },
    { key: "paginas", label: "Páginas", render: (row) => formatNullableMetric(row.total_paginas) },
  ];
  return (
    <DetailTable
      coletaId={coletaId}
      cacheKey={edocsMensalCacheKeys.organizacoes}
      load={listResultadosMensaisOrganizacoesEdocs}
      columns={columns}
      getRowKey={(row) => row.id}
      initialSorting={[{ key: "nome_organizacao", direction: "asc" }]}
      searchable
      searchPlaceholder="Organização, patriarca ou ID externo"
      emptyMessage="Nenhum resultado por organização disponível."
      errorMessage="Não foi possível carregar os resultados por organização."
    />
  );
}

function RawSources({ coletaId }: { coletaId: string }) {
  type SortKey = "codigo_fonte" | "criado_em";
  const columns: AdminTableColumn<FonteBrutaColetaMensalEdocs, SortKey>[] = [
    { key: "fonte", label: "Fonte", sortKey: "codigo_fonte", render: (row) => <strong>{row.codigo_fonte}</strong> },
    { key: "patriarca", label: "Patriarca externo", render: (row) => row.id_patriarca_externo ?? "Não se aplica" },
    { key: "hash", label: "SHA-256", render: (row) => <span className="font-mono text-[11px]">{row.hash_sha256}</span> },
    { key: "criado", label: "Registrada em", sortKey: "criado_em", render: (row) => formatAdminDate(row.criado_em) },
  ];
  return (
    <div>
      <AdminAlert>Somente metadados de preservação estão disponíveis. Não há contrato para download ou visualização do conteúdo bruto.</AdminAlert>
      <div className="mt-4">
        <DetailTable
          coletaId={coletaId}
          cacheKey={edocsMensalCacheKeys.fontes}
          load={listFontesBrutasColetasMensaisEdocs}
          columns={columns}
          getRowKey={(row) => row.id}
          initialSorting={[{ key: "criado_em", direction: "desc" }]}
          emptyMessage="Nenhuma fonte bruta registrada."
          errorMessage="Não foi possível carregar os metadados das fontes."
        />
      </div>
    </div>
  );
}

function MonthlyAudit({ coletaId }: { coletaId: string }) {
  type SortKey = "tipo_evento" | "criado_em";
  const columns: AdminTableColumn<EventoAuditoriaColetaMensalEdocs, SortKey>[] = [
    {
      key: "evento",
      label: "Evento",
      sortKey: "tipo_evento",
      render: (row) => <strong>{monthlyAuditEventLabels[row.tipo_evento]}</strong>,
    },
    { key: "mensagem", label: "Mensagem", render: (row) => row.mensagem },
    { key: "ator", label: "Responsável", render: (row) => row.criado_por_nome || "Sistema" },
    { key: "data", label: "Data e hora", sortKey: "criado_em", render: (row) => formatAdminDate(row.criado_em) },
  ];
  return (
    <DetailTable
      coletaId={coletaId}
      cacheKey={edocsMensalCacheKeys.auditoria}
      load={listAuditoriaColetasMensaisEdocs}
      columns={columns}
      getRowKey={(row) => row.id}
      initialSorting={[{ key: "criado_em", direction: "desc" }]}
      emptyMessage="Nenhum evento de auditoria registrado."
      errorMessage="Não foi possível carregar a auditoria mensal."
    />
  );
}

export const monthlyAuditEventLabels = {
  SOLICITADA: "Coleta solicitada",
  EXECUCAO_INICIADA: "Execução iniciada",
  SUCESSO: "Coleta concluída com sucesso",
  ERRO: "Coleta concluída com erro",
  REENCAMINHADA: "Solicitação reencaminhada",
} satisfies Record<TipoEventoColetaMensalEdocs, string>;

function DetailTable<Row, SortKey extends string>({
  coletaId,
  cacheKey,
  load,
  columns,
  getRowKey,
  initialSorting,
  searchable = false,
  searchPlaceholder,
  emptyMessage,
  errorMessage,
}: {
  coletaId: string;
  cacheKey: (values: readonly unknown[]) => readonly unknown[];
  load: (query: MonthlyDetailQuery) => Promise<PaginatedResponse<Row>>;
  columns: AdminTableColumn<Row, SortKey>[];
  getRowKey: (row: Row) => Key;
  initialSorting: AdminSortRule<SortKey>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage: string;
  errorMessage: string;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [density, setDensity] = useState<AdminTableDensity>("compact");
  const [sorting, setSorting] = useState(initialSorting);
  const ordering = edocsOrdering(sorting);
  const key = cacheKey([coletaId, page, pageSize, search, ordering]);
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    () => load({
      coleta_id: coletaId,
      page,
      page_size: pageSize,
      search: searchable ? search.trim() || undefined : undefined,
      ordering,
    }),
    { keepPreviousData: true, revalidateOnFocus: false },
  );

  function toggleSort(sortKey: SortKey, additive: boolean) {
    setPage(1);
    setSorting((current) => nextEdocsSorting(current, sortKey, additive));
  }

  return (
    <div>
      {searchable && (
        <div className="mb-3 max-w-lg">
          <EdocsTextFilter
            label="Pesquisar"
            value={search}
            placeholder={searchPlaceholder}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
          />
        </div>
      )}
      <AdminDataTable
        rows={data?.results ?? []}
        columns={columns}
        getRowKey={getRowKey}
        sorting={sorting}
        onSort={toggleSort}
        page={page}
        pageSize={pageSize}
        pageSizeOptions={[10, 20, 50]}
        totalCount={data?.count ?? 0}
        hasPreviousPage={Boolean(data?.previous)}
        hasNextPage={Boolean(data?.next)}
        onPageChange={setPage}
        onPageSizeChange={(value) => {
          setPageSize(value);
          setPage(1);
        }}
        density={density}
        onDensityChange={setDensity}
        onResetView={() => {
          setSorting(initialSorting);
          setDensity("compact");
        }}
        isLoading={isLoading}
        isRefreshing={isValidating && Boolean(data)}
        errorMessage={error ? getApiErrorMessage(error, errorMessage) : null}
        onRetry={() => mutate()}
        emptyMessage={emptyMessage}
      />
    </div>
  );
}

export function formatNullableMetric(value: number | null): ReactNode {
  return value === null ? (
    <span className="text-xs text-slate-500">Não informado pela origem</span>
  ) : (
    value.toLocaleString("pt-BR")
  );
}

function formatNullableDate(value: string | null) {
  return value ? formatAdminDate(value) : "Não informado";
}
