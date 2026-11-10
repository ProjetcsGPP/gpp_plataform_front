"use client";

import { useState } from "react";
import useSWR from "swr";

import {
  AdminDataTable,
  type AdminTableColumn,
} from "@/components/admin/AdminDataTable";
import { AdminAlert, AdminPanel } from "@/components/admin/AdminPage";
import {
  EdocsFilters,
  EdocsJsonBlock,
  EdocsModal,
  EdocsSelectFilter,
  EdocsTextFilter,
} from "@/features/publicacoes/edocs/EdocsUi";
import {
  alterarMinhaPreferenciaEflow,
  listAuditoriaEflow,
  listAuditoriaPreferenciaEflow,
  listDefinicoesEflow,
} from "@/features/publicacoes/eflow/api";
import { eflowCacheKeys } from "@/features/publicacoes/eflow/cache";
import { EflowDonutChart } from "@/features/publicacoes/eflow/EflowDonutChart";
import type {
  ColetaEflow,
  DefinicaoFluxoEflow,
  EventoAuditoriaEflow,
  EventoAuditoriaPreferenciaEflow,
  IndicadorOrgaoEflow,
  IndicadorPublicoAlvoEflow,
  PerfilCalculoEflow,
  PreferenciaExibicaoEflow,
  ResultadoCalculoEflow,
} from "@/features/publicacoes/eflow/model";
import {
  EFLOW_PREFERENCE_ACTION,
  EFLOW_PROFILE_LABELS,
  findResultByProfile,
} from "@/features/publicacoes/eflow/profiles";
import { Button } from "@/components/ui/button";
import { formatFileSize, formatPercent } from "@/features/publicacoes/eflow/format";
import { formatAdminDate } from "@/lib/adminResource";
import { getApiErrorMessage } from "@/lib/apiErrors";
import type { AdminSortRule, AdminTableDensity } from "@/types/admin";

export function EflowDetailsDialog({
  coleta,
  preference,
  canViewResults,
  canChangePreference,
  canViewPreferenceAudit,
  canViewDefinitions,
  canViewAudit,
  onPreferenceChanged,
  onClose,
}: {
  coleta: ColetaEflow;
  preference: PreferenciaExibicaoEflow;
  canViewResults: boolean;
  canChangePreference: boolean;
  canViewPreferenceAudit: boolean;
  canViewDefinitions: boolean;
  canViewAudit: boolean;
  onPreferenceChanged: (preference: PreferenciaExibicaoEflow) => Promise<void>;
  onClose: () => void;
}) {
  const [activeProfile, setActiveProfile] = useState<PerfilCalculoEflow>(
    preference.perfil_preferido,
  );
  const [savingPreference, setSavingPreference] = useState(false);
  const [preferenceFeedback, setPreferenceFeedback] = useState<{
    kind: "error" | "success";
    message: string;
  } | null>(null);
  const activeResult = findResultByProfile(coleta, activeProfile);
  const canPersistPreference =
    canChangePreference &&
    preference.acoes_disponiveis.includes(EFLOW_PREFERENCE_ACTION);
  const hasResults = coleta.resultados_calculo.length > 0;

  async function savePreference() {
    setSavingPreference(true);
    setPreferenceFeedback(null);
    try {
      const updated = await alterarMinhaPreferenciaEflow(activeProfile);
      await onPreferenceChanged(updated);
      setPreferenceFeedback({
        kind: "success",
        message: "Sua preferência de exibição foi atualizada.",
      });
    } catch (caught) {
      setActiveProfile(preference.perfil_preferido);
      setPreferenceFeedback({
        kind: "error",
        message: getApiErrorMessage(
          caught,
          "Não foi possível atualizar sua preferência de exibição.",
        ),
      });
    } finally {
      setSavingPreference(false);
    }
  }

  return (
    <EdocsModal
      title={`Detalhes da coleta — ${coleta.arquivo_nome}`}
      onClose={onClose}
      extraWide
    >
      <div className="mt-5 space-y-6">
        {coleta.situacao === "FALHOU" && (
          <AdminAlert>
            <strong>{coleta.codigo_erro || "COLETA_FALHOU"}</strong>
            <span className="ml-1">{coleta.mensagem_erro || "O processamento da coleta falhou."}</span>
          </AdminAlert>
        )}

        {!canViewResults && hasResults && (
          <AdminAlert>
            Você não possui permissão para consultar os resultados calculados desta coleta.
          </AdminAlert>
        )}

        {canViewResults && !hasResults && (
          <AdminAlert>
            Esta coleta não possui resultados calculados. A preferência individual foi mantida.
          </AdminAlert>
        )}

        {canViewResults && hasResults && (
          <>
            <ProfileComparison
              coleta={coleta}
              activeProfile={activeProfile}
              preferredProfile={preference.perfil_preferido}
              onSelect={(profile) => {
                setActiveProfile(profile);
                setPreferenceFeedback(null);
              }}
            />

            {preferenceFeedback && (
              <AdminAlert
                variant={preferenceFeedback.kind}
                onClose={() => setPreferenceFeedback(null)}
              >
                {preferenceFeedback.message}
              </AdminAlert>
            )}

            {activeProfile !== preference.perfil_preferido &&
              canPersistPreference && (
                <div className="flex justify-end">
                  <Button onClick={savePreference} disabled={savingPreference}>
                    {savingPreference
                      ? "Salvando preferência..."
                      : "Definir como minha preferência"}
                  </Button>
                </div>
              )}

            {activeResult ? (
              <ProfileResult result={activeResult} />
            ) : (
              <AdminAlert>
                O resultado do perfil selecionado não está disponível para esta coleta.
              </AdminAlert>
            )}
          </>
        )}

        <AdminPanel className="p-4">
          <h3 className="font-semibold text-slate-900">Arquivo e processamento</h3>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <Metadata label="Hash SHA-256" value={coleta.arquivo_hash_sha256} mono />
            <Metadata label="Tamanho" value={formatFileSize(coleta.arquivo_tamanho_bytes)} />
            <Metadata label="Início" value={formatAdminDate(coleta.iniciada_em)} />
            <Metadata
              label="Conclusão"
              value={coleta.concluida_em ? formatAdminDate(coleta.concluida_em) : "—"}
            />
          </dl>
        </AdminPanel>

        {canViewDefinitions && <DefinitionsSection coletaId={coleta.id} />}
        {canViewAudit && <AuditSection coletaId={coleta.id} />}
        {canViewPreferenceAudit && <PreferenceAuditSection />}
      </div>
    </EdocsModal>
  );
}

function ProfileComparison({
  coleta,
  activeProfile,
  preferredProfile,
  onSelect,
}: {
  coleta: ColetaEflow;
  activeProfile: PerfilCalculoEflow;
  preferredProfile: PerfilCalculoEflow;
  onSelect: (profile: PerfilCalculoEflow) => void;
}) {
  const profiles: PerfilCalculoEflow[] = [
    "COMPLETO_TECNICO",
    "CONSOLIDADO_PUBLICACAO",
  ];

  return (
    <section aria-labelledby="eflow-profiles-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 id="eflow-profiles-title" className="font-semibold text-slate-900">
            Perfis de cálculo
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Compare os dois resultados imutáveis calculados pelo backend.
          </p>
        </div>
        <div
          className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1"
          role="tablist"
          aria-label="Perfil de cálculo E-Flow"
        >
          {profiles.map((profile) => {
            const available = Boolean(findResultByProfile(coleta, profile));
            return (
              <button
                key={profile}
                type="button"
                role="tab"
                aria-selected={activeProfile === profile}
                disabled={!available}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  activeProfile === profile
                    ? "bg-white text-app-primary shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                onClick={() => onSelect(profile)}
              >
                {EFLOW_PROFILE_LABELS[profile]}
                {preferredProfile === profile && (
                  <span className="ml-2 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-sky-700">
                    Preferido
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {profiles.map((profile) => (
          <ProfileSummary
            key={profile}
            profile={profile}
            result={findResultByProfile(coleta, profile)}
            active={profile === activeProfile}
          />
        ))}
      </div>
    </section>
  );
}

function ProfileSummary({
  profile,
  result,
  active,
}: {
  profile: PerfilCalculoEflow;
  result?: ResultadoCalculoEflow;
  active: boolean;
}) {
  return (
    <AdminPanel className={`p-4 ${active ? "ring-2 ring-app-primary" : ""}`}>
      <h4 className="font-semibold text-slate-900">
        {EFLOW_PROFILE_LABELS[profile]}
      </h4>
      {result ? (
        <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
          <ComparisonValue label="Fluxos" value={result.quantidade_fluxos} />
          <ComparisonValue
            label="Órgãos"
            value={result.quantidade_orgaos_participantes}
          />
          <ComparisonValue label="Setores" value={result.quantidade_setores_ativos} />
        </dl>
      ) : (
        <p className="mt-3 text-sm text-slate-500">Resultado indisponível.</p>
      )}
    </AdminPanel>
  );
}

function ComparisonValue({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-900">
        {value.toLocaleString("pt-BR")}
      </dd>
    </div>
  );
}

function ProfileResult({ result }: { result: ResultadoCalculoEflow }) {
  return (
    <section
      aria-labelledby="eflow-indicators-title"
      role="tabpanel"
      className="space-y-4"
    >
      <div>
        <h3 id="eflow-indicators-title" className="mb-3 font-semibold text-slate-900">
          Indicadores — {EFLOW_PROFILE_LABELS[result.perfil]}
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <Indicator label="Total de Fluxos" value={result.quantidade_fluxos} />
          <Indicator
            label="Órgãos Participantes"
            value={result.quantidade_orgaos_participantes}
          />
          <Indicator label="Setores Ativos" value={result.quantidade_setores_ativos} />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <AccessiblePieChart
          title="Órgãos com mais fluxos"
          ariaLabel={`Distribuição dos órgãos no perfil ${EFLOW_PROFILE_LABELS[result.perfil]}`}
          rows={result.orgaos_maior_quantidade_fluxos}
          getLabel={(row) => getOrganizationAcronym(row.orgao)}
          showCountedFlowsTotal
        />
        <AccessiblePieChart
          title="Distribuição por público-alvo"
          ariaLabel={`Distribuição por público-alvo no perfil ${EFLOW_PROFILE_LABELS[result.perfil]}`}
          rows={result.distribuicao_publico_alvo}
          getLabel={(row) => row.publico_alvo}
        />
      </div>
    </section>
  );
}

function Indicator({ label, value }: { label: string; value: number }) {
  return (
    <AdminPanel className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value.toLocaleString("pt-BR")}</p>
    </AdminPanel>
  );
}

type PieRow = IndicadorOrgaoEflow | IndicadorPublicoAlvoEflow;

function AccessiblePieChart<Row extends PieRow>({
  title,
  ariaLabel,
  rows,
  getLabel,
  showCountedFlowsTotal = false,
}: {
  title: string;
  ariaLabel: string;
  rows: Row[];
  getLabel: (row: Row) => string;
  showCountedFlowsTotal?: boolean;
}) {
  const countedFlowsTotal = rows.reduce(
    (total, row) => total + row.quantidade_fluxos,
    0,
  );
  const chartData = rows.map((row) => ({
    name: getLabel(row),
    value: row.quantidade_fluxos,
    percentage: row.percentual,
  }));

  return (
    <AdminPanel className="p-4">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <div className="mt-2">
        <EflowDonutChart
          ariaLabel={
            showCountedFlowsTotal
              ? `${ariaLabel}. ${countedFlowsTotal.toLocaleString("pt-BR")} fluxos contabilizados nesta visão.`
              : ariaLabel
          }
          data={chartData}
          centerTotal={showCountedFlowsTotal ? countedFlowsTotal : undefined}
        />
        <div className="mt-2 min-w-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">Dados equivalentes ao gráfico: {title}</caption>
            <thead className="text-slate-500">
              <tr>
                <th className="pb-2 font-semibold">Categoria</th>
                <th className="pb-2 text-right font-semibold">
                  Fluxos contabilizados
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={getLabel(row)}>
                  <td className="py-2 pr-2">
                    <span className="font-medium text-slate-800">{getLabel(row)}</span>
                  </td>
                  <td className="whitespace-nowrap py-2 text-right font-medium text-slate-800">
                    {row.quantidade_fluxos.toLocaleString("pt-BR")} ({formatPercent(row.percentual)})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="py-4 text-sm text-slate-500">Sem indicadores disponíveis.</p>}
        </div>
      </div>
    </AdminPanel>
  );
}

export function getOrganizationAcronym(organization: string): string {
  if (organization === "Outros") return organization;
  return organization.split(/\s[-–—]\s/, 1)[0].trim();
}

function Metadata({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className={`mt-1 break-all text-slate-800 ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}

function DefinitionsSection({ coletaId }: { coletaId: string }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [audience, setAudience] = useState("");
  const [density, setDensity] = useState<AdminTableDensity>("compact");
  const key = eflowCacheKeys.definicoes([coletaId, page, pageSize, search, audience]);
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    () =>
      listDefinicoesEflow({
        coleta_id: coletaId,
        page,
        page_size: pageSize,
        search: search.trim() || undefined,
        publico_alvo: audience || undefined,
        ordering: "nome",
      }),
    { keepPreviousData: true, revalidateOnFocus: false },
  );
  const columns: AdminTableColumn<DefinicaoFluxoEflow, never>[] = [
    { key: "id", label: "ID externo", render: (row) => <span className="font-mono text-xs">{row.id_externo}</span> },
    { key: "nome", label: "Nome", render: (row) => row.nome },
    { key: "versao", label: "Versão", render: (row) => row.versao_origem },
    { key: "publico", label: "Público-alvo", render: (row) => row.publico_alvo },
    { key: "sigla", label: "Patriarca", render: (row) => <span title={`${row.patriarca_nome} — ${row.patriarca_texto}`}>{row.patriarca_sigla}</span> },
    { key: "orgao", label: "Órgão", render: (row) => row.orgao },
    { key: "setor", label: "Setor", render: (row) => row.setor },
  ];

  return (
    <section aria-labelledby="eflow-definitions-title">
      <h3 id="eflow-definitions-title" className="font-semibold text-slate-900">Definições normalizadas</h3>
      <p className="mt-1 text-sm text-slate-600">Linhas desta coleta, paginadas pelo backend.</p>
      <div className="mt-3">
        <EdocsFilters>
          <EdocsTextFilter label="Pesquisar" value={search} placeholder="Nome, órgão, setor ou patriarca" onChange={(value) => { setSearch(value); setPage(1); }} />
          <EdocsSelectFilter label="Público-alvo" value={audience} onChange={(value) => { setAudience(value); setPage(1); }}>
            <option value="">Todos</option>
            <option value="Cidadão">Cidadão</option>
            <option value="Órgão">Órgão</option>
            <option value="Patriarca">Patriarca</option>
            <option value="Setor">Setor</option>
            <option value="Lista de Permissão">Lista de Permissão</option>
          </EdocsSelectFilter>
        </EdocsFilters>
        <AdminDataTable
          rows={data?.results ?? []}
          columns={columns}
          getRowKey={(row) => row.id}
          sorting={[] as AdminSortRule<never>[]}
          onSort={() => undefined}
          page={page}
          pageSize={pageSize}
          pageSizeOptions={[10, 20, 50]}
          totalCount={data?.count ?? 0}
          hasPreviousPage={Boolean(data?.previous)}
          hasNextPage={Boolean(data?.next)}
          onPageChange={setPage}
          onPageSizeChange={(value) => { setPageSize(value); setPage(1); }}
          density={density}
          onDensityChange={setDensity}
          onResetView={() => { setSearch(""); setAudience(""); setDensity("compact"); setPage(1); }}
          isLoading={isLoading}
          isRefreshing={isValidating && Boolean(data)}
          errorMessage={error ? getApiErrorMessage(error, "Não foi possível carregar as definições E-Flow.") : null}
          onRetry={() => mutate()}
          emptyMessage="Nenhuma definição encontrada para esta coleta."
        />
      </div>
    </section>
  );
}

function AuditSection({ coletaId }: { coletaId: string }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [eventType, setEventType] = useState("");
  const [density, setDensity] = useState<AdminTableDensity>("compact");
  const key = eflowCacheKeys.auditoria([coletaId, page, pageSize, eventType]);
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    () => listAuditoriaEflow({ coleta_id: coletaId, page, page_size: pageSize, tipo_evento: eventType || undefined, ordering: "-criado_em" }),
    { keepPreviousData: true, revalidateOnFocus: false },
  );
  const columns: AdminTableColumn<EventoAuditoriaEflow, never>[] = [
    { key: "data", label: "Data e hora", render: (row) => formatAdminDate(row.criado_em) },
    { key: "tipo", label: "Tipo", render: (row) => row.tipo_evento.replaceAll("_", " ") },
    { key: "mensagem", label: "Mensagem", render: (row) => row.mensagem },
    { key: "metadados", label: "Metadados", render: (row) => <EdocsJsonBlock title="Metadados" value={row.metadados} /> },
    { key: "responsavel", label: "Responsável", render: (row) => row.criado_por_nome || "Sistema" },
  ];

  return (
    <section aria-labelledby="eflow-audit-title">
      <h3 id="eflow-audit-title" className="font-semibold text-slate-900">Auditoria</h3>
      <p className="mt-1 text-sm text-slate-600">Eventos imutáveis associados a esta coleta.</p>
      <div className="mt-3">
        <EdocsFilters>
          <EdocsSelectFilter label="Tipo de evento" value={eventType} onChange={(value) => { setEventType(value); setPage(1); }}>
            <option value="">Todos</option>
            <option value="COLETA_INICIADA">Coleta iniciada</option>
            <option value="COLETA_CONCLUIDA">Coleta concluída</option>
            <option value="COLETA_FALHOU">Coleta falhou</option>
          </EdocsSelectFilter>
        </EdocsFilters>
        <AdminDataTable
          rows={data?.results ?? []}
          columns={columns}
          getRowKey={(row) => row.id}
          sorting={[] as AdminSortRule<never>[]}
          onSort={() => undefined}
          page={page}
          pageSize={pageSize}
          pageSizeOptions={[10, 20, 50]}
          totalCount={data?.count ?? 0}
          hasPreviousPage={Boolean(data?.previous)}
          hasNextPage={Boolean(data?.next)}
          onPageChange={setPage}
          onPageSizeChange={(value) => { setPageSize(value); setPage(1); }}
          density={density}
          onDensityChange={setDensity}
          onResetView={() => { setEventType(""); setDensity("compact"); setPage(1); }}
          isLoading={isLoading}
          isRefreshing={isValidating && Boolean(data)}
          errorMessage={error ? getApiErrorMessage(error, "Não foi possível carregar a auditoria E-Flow.") : null}
          onRetry={() => mutate()}
          emptyMessage="Nenhum evento registrado para esta coleta."
        />
      </div>
    </section>
  );
}

function PreferenceAuditSection() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [density, setDensity] = useState<AdminTableDensity>("compact");
  const key = eflowCacheKeys.auditoriaPreferencia([page, pageSize]);
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    () =>
      listAuditoriaPreferenciaEflow({
        page,
        page_size: pageSize,
        ordering: "-criado_em",
      }),
    { keepPreviousData: true, revalidateOnFocus: false },
  );
  const columns: AdminTableColumn<EventoAuditoriaPreferenciaEflow, never>[] = [
    {
      key: "data",
      label: "Data e hora",
      render: (row) => formatAdminDate(row.criado_em),
    },
    {
      key: "evento",
      label: "Evento",
      render: (row) => row.tipo_evento.replaceAll("_", " "),
    },
    {
      key: "anterior",
      label: "Perfil anterior",
      render: (row) =>
        row.perfil_anterior
          ? EFLOW_PROFILE_LABELS[row.perfil_anterior]
          : "—",
    },
    {
      key: "atual",
      label: "Perfil atual",
      render: (row) => EFLOW_PROFILE_LABELS[row.perfil_atual],
    },
  ];

  return (
    <section aria-labelledby="eflow-preference-audit-title">
      <h3
        id="eflow-preference-audit-title"
        className="font-semibold text-slate-900"
      >
        Histórico da minha preferência
      </h3>
      <p className="mt-1 text-sm text-slate-600">
        Auditoria individual, separada dos eventos do snapshot E-Flow.
      </p>
      <div className="mt-3">
        <AdminDataTable
          rows={data?.results ?? []}
          columns={columns}
          getRowKey={(row) => row.id}
          sorting={[] as AdminSortRule<never>[]}
          onSort={() => undefined}
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
            setDensity("compact");
            setPage(1);
          }}
          isLoading={isLoading}
          isRefreshing={isValidating && Boolean(data)}
          errorMessage={
            error
              ? getApiErrorMessage(
                  error,
                  "Não foi possível carregar o histórico da preferência.",
                )
              : null
          }
          onRetry={() => mutate()}
          emptyMessage="Nenhuma alteração de preferência registrada."
        />
      </div>
    </section>
  );
}
