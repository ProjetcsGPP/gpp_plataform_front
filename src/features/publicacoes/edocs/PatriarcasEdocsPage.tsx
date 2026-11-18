"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Eye, ListChecks } from "lucide-react";

import { AdminDataTable, type AdminTableColumn } from "@/components/admin/AdminDataTable";
import { AdminAlert } from "@/components/admin/AdminPage";
import { AdminLoading } from "@/components/admin/AdminLoading";
import { RouteGuard } from "@/components/common/RouteGuard";
import { Button } from "@/components/ui/button";
import {
  alterarSelecaoColetaEdocs,
  listPatriarcasEdocs,
  listImplantacoesEdocs,
} from "@/features/publicacoes/edocs/api";
import { EDOCS_ACTIONS, hasEdocsAction } from "@/features/publicacoes/edocs/actions";
import { edocsCacheKeys, revalidateEdocsCaches } from "@/features/publicacoes/edocs/cache";
import {
  EdocsFilters,
  EdocsModal,
  EdocsPage,
  EdocsSelectFilter,
  EdocsStatusBadge,
  EdocsTextFilter,
} from "@/features/publicacoes/edocs/EdocsUi";
import type {
  PatriarcaEdocs,
  ImplantacaoPatriarcaEdocs,
} from "@/features/publicacoes/edocs/model";
import { edocsOrdering, nextEdocsSorting } from "@/features/publicacoes/edocs/table";
import { MunicipiosEdocsPanel } from "@/features/publicacoes/edocs/municipios/MunicipiosEdocsPanel";
import { usePermissions } from "@/hooks/usePermissions";
import { formatAdminDate } from "@/lib/adminResource";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { PERMISSIONS } from "@/lib/permissions";
import type { AdminSortRule, AdminTableDensity } from "@/types/admin";

type SortKey = "nome" | "sigla" | "ativo" | "coletar_detalhes" | "atualizado_em";

export function PatriarcasEdocsPage() {
  const { can } = usePermissions();
  const { mutate: mutateCache } = useSWRConfig();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("");
  const [collectDetails, setCollectDetails] = useState("");
  const [density, setDensity] = useState<AdminTableDensity>("compact");
  const [sorting, setSorting] = useState<AdminSortRule<SortKey>[]>([
    { key: "nome", direction: "asc" },
  ]);
  const [selected, setSelected] = useState<PatriarcaEdocs | null>(null);
  const canViewPatriarcas = can(PERMISSIONS.EDOCS_PATRIARCA_VIEW);
  const canViewMunicipios = can(PERMISSIONS.EDOCS_MUNICIPIO_VIEW);
  const [activeView, setActiveView] = useState<"patriarcas" | "municipios">(
    canViewPatriarcas ? "patriarcas" : "municipios",
  );
  const [implantationDetails, setImplantationDetails] =
    useState<PatriarcaEdocs | null>(null);
  const [feedback, setFeedback] = useState<{
    kind: "error" | "success";
    message: string;
  } | null>(null);
  const ordering = edocsOrdering(sorting);
  const key = edocsCacheKeys.patriarcas([
    page,
    pageSize,
    search,
    active,
    collectDetails,
    ordering,
  ]);
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    () =>
      listPatriarcasEdocs({
        page,
        page_size: pageSize,
        ordering,
        search: search.trim() || undefined,
        ativo: active ? active === "true" : undefined,
        coletar_detalhes: collectDetails
          ? collectDetails === "true"
          : undefined,
      }),
    { keepPreviousData: true, revalidateOnFocus: false },
  );

  function changeFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  function toggleSort(sortKey: SortKey, additive: boolean) {
    setPage(1);
    setSorting((current) => nextEdocsSorting(current, sortKey, additive));
  }

  const columns: AdminTableColumn<PatriarcaEdocs, SortKey>[] = [
    {
      key: "sigla",
      label: "Sigla",
      sortKey: "sigla",
      className: "font-semibold",
      render: (row) => row.sigla || "—",
    },
    {
      key: "nome",
      label: "Nome",
      sortKey: "nome",
      render: (row) => (
        <div>
          <span className="font-medium">{row.nome}</span>
          <span className="block text-xs text-slate-500">{row.id_externo}</span>
        </div>
      ),
    },
    {
      key: "tipo",
      label: "Tipo",
      render: (row) => row.descricao_tipo_agente,
    },
    {
      key: "coleta",
      label: "Coleta detalhada",
      sortKey: "coletar_detalhes",
      render: (row) => (
        <EdocsStatusBadge positive={row.coletar_detalhes}>
          {row.coletar_detalhes ? "Selecionado" : "Não selecionado"}
        </EdocsStatusBadge>
      ),
    },
    {
      key: "situacao",
      label: "Situação",
      sortKey: "ativo",
      render: (row) => (
        <EdocsStatusBadge positive={row.ativo} negative={!row.ativo}>
          {row.ativo ? "Ativo" : "Inativo"}
        </EdocsStatusBadge>
      ),
    },
    {
      key: "municipio",
      label: "Município",
      render: (row) => (
        <div className="text-xs">
          <span className="font-medium text-slate-800">
            {row.codigo_municipio ?? "Não informado"}
          </span>
          <span className="mt-1 block text-slate-500">
            {municipalIndicatorSummary(row)}
          </span>
        </div>
      ),
    },
    {
      key: "implantacao_observada",
      label: "Implantação E-Docs observada",
      render: (row) => row.implantacao_edocs_observada ? (
        <Button variant="outline" size="sm" onClick={() => setImplantationDetails(row)}><Eye aria-hidden="true" /> {row.implantacao_edocs_observada.competencia}</Button>
      ) : <span className="text-xs text-slate-500">Não observada</span>,
    },
    {
      key: "atualizado",
      label: "Atualizado em",
      sortKey: "atualizado_em",
      render: (row) => formatAdminDate(row.atualizado_em),
    },
    {
      key: "acoes",
      label: "Ações",
      headerClassName: "text-right",
      className: "text-right",
      render: (row) => {
        const canChangeSelection =
          can(PERMISSIONS.EDOCS_PATRIARCA_SELECIONAR_COLETA) &&
          hasEdocsAction(
            row.acoes_disponiveis,
            EDOCS_ACTIONS.ALTERAR_SELECAO_COLETA,
          );
        if (!canChangeSelection) {
          return <span className="text-xs text-slate-400">Sem ações</span>;
        }

        return (
          <div className="flex justify-end gap-2">
            {canChangeSelection && (
              <Button variant="outline" size="sm" onClick={() => setSelected(row)}>
                <ListChecks aria-hidden="true" /> Alterar seleção
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <RouteGuard
      permission={[
        PERMISSIONS.EDOCS_PATRIARCA_VIEW,
        PERMISSIONS.EDOCS_MUNICIPIO_VIEW,
      ]}
      mode="any"
      loadingFallback={<AdminLoading label="Verificando acesso ao catálogo..." />}
    >
      <EdocsPage
        title="Catálogo E-Docs"
        description="Patriarcas observados na API oficial e cadastro municipal independente."
      >
        {feedback && (
          <div className="mb-4">
            <AdminAlert
              variant={feedback.kind}
              onClose={() => setFeedback(null)}
            >
              {feedback.message}
            </AdminAlert>
          </div>
        )}
        <div className="mb-5 flex gap-2 border-b border-slate-200" role="tablist" aria-label="Visões do catálogo E-Docs">
          {canViewPatriarcas && <Button role="tab" aria-selected={activeView === "patriarcas"} variant={activeView === "patriarcas" ? "secondary" : "ghost"} className="rounded-b-none" onClick={() => setActiveView("patriarcas")}>Patriarcas</Button>}
          {canViewMunicipios && <Button role="tab" aria-selected={activeView === "municipios"} variant={activeView === "municipios" ? "secondary" : "ghost"} className="rounded-b-none" onClick={() => setActiveView("municipios")}>Municípios</Button>}
        </div>
        {activeView === "patriarcas" && canViewPatriarcas && <>
        <EdocsFilters>
          <EdocsTextFilter
            label="Pesquisar"
            value={search}
            placeholder="Nome, sigla ou ID externo"
            onChange={(value) => changeFilter(setSearch, value)}
          />
          <EdocsSelectFilter
            label="Situação"
            value={active}
            onChange={(value) => changeFilter(setActive, value)}
          >
            <option value="">Todas</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </EdocsSelectFilter>
          <EdocsSelectFilter
            label="Coleta detalhada"
            value={collectDetails}
            onChange={(value) => changeFilter(setCollectDetails, value)}
          >
            <option value="">Todos</option>
            <option value="true">Selecionados</option>
            <option value="false">Não selecionados</option>
          </EdocsSelectFilter>
        </EdocsFilters>
        <AdminDataTable
          rows={data?.results ?? []}
          columns={columns}
          getRowKey={(row) => row.id}
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
            setSorting([{ key: "nome", direction: "asc" }]);
            setDensity("compact");
          }}
          isLoading={isLoading}
          isRefreshing={isValidating && Boolean(data)}
          errorMessage={
            error
              ? getApiErrorMessage(error, "Não foi possível carregar o catálogo.")
              : null
          }
          onRetry={() => mutate()}
          emptyMessage="Nenhum patriarca encontrado."
        />
        {can(PERMISSIONS.EDOCS_IMPLANTACAO_VIEW) && <ImplantacoesEdocsPanel />}
        </>}
        {activeView === "municipios" && canViewMunicipios && <MunicipiosEdocsPanel />}
      </EdocsPage>

      {selected && (
        <SelecaoColetaDialog
          patriarca={selected}
          onClose={() => setSelected(null)}
          onSave={async (justificativa) => {
            try {
              await alterarSelecaoColetaEdocs(selected.id, {
                coletar_detalhes: !selected.coletar_detalhes,
                justificativa,
              });
              setSelected(null);
              await revalidateEdocsCaches(mutateCache);
              setFeedback({
                kind: "success",
                message: "Seleção para coleta atualizada e registrada na auditoria.",
              });
            } catch (caught) {
              setFeedback({
                kind: "error",
                message: getApiErrorMessage(
                  caught,
                  "Não foi possível alterar a seleção para coleta.",
                ),
              });
            }
          }}
        />
      )}

      {implantationDetails && <ImplantationEvidenceDialog patriarca={implantationDetails} onClose={() => setImplantationDetails(null)} />}
    </RouteGuard>
  );
}

function ImplantationEvidenceDialog({ patriarca, onClose }: { patriarca: PatriarcaEdocs; onClose: () => void }) {
  const evidence = patriarca.implantacao_edocs_observada;
  return <EdocsModal title="Implantação E-Docs observada" onClose={onClose} wide>{evidence && <div className="mt-4 space-y-4 text-sm"><p><strong>{patriarca.sigla}</strong> — {patriarca.nome}</p><dl className="grid gap-3 sm:grid-cols-2"><div><dt className="text-xs text-slate-500">Primeira competência positiva</dt><dd className="font-semibold">{evidence.competencia}</dd></div><div><dt className="text-xs text-slate-500">Critério</dt><dd className="font-semibold">{evidence.criterio}</dd></div><div><dt className="text-xs text-slate-500">Coleta de evidência</dt><dd className="break-all">{evidence.coleta_evidencia_id}</dd></div><div><dt className="text-xs text-slate-500">Registrado em</dt><dd>{formatAdminDate(evidence.criado_em)}</dd></div></dl><p className="rounded-lg bg-sky-50 p-3 text-sky-950">Registro somente leitura produzido a partir da primeira atividade positiva observada na API oficial. Resultado zerado não é interpretado como implantação.</p><details><summary className="cursor-pointer font-medium">Totais da evidência</summary><pre className="mt-2 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">{JSON.stringify(evidence.totais_evidencia, null, 2)}</pre></details></div>}</EdocsModal>;
}

function ImplantacoesEdocsPanel() {
  const [year, setYear] = useState(""); const [month, setMonth] = useState(""); const [search, setSearch] = useState("");
  const [density, setDensity] = useState<AdminTableDensity>("compact");
  const key = edocsCacheKeys.implantacoes([year, month, search]);
  const { data, error, isLoading, mutate } = useSWR(key, () => listImplantacoesEdocs({ page: 1, page_size: 100, ordering: "ano,mes", ano: year ? Number(year) : undefined, mes: month ? Number(month) : undefined, search: search.trim() || undefined }), { keepPreviousData: true, revalidateOnFocus: false });
  const columns: AdminTableColumn<ImplantacaoPatriarcaEdocs, string>[] = [
    { key: "patriarca", label: "Patriarca", render: row => <div><strong>{row.patriarca_sigla}</strong><span className="block text-xs text-slate-500">{row.patriarca_nome}</span></div> },
    { key: "competencia", label: "Primeira competência positiva", render: row => row.competencia },
    { key: "criterio", label: "Critério", render: row => row.criterio },
    { key: "registro", label: "Registrado em", render: row => formatAdminDate(row.criado_em) },
  ];
  return <section className="mt-8" aria-labelledby="implantacoes-title"><h2 id="implantacoes-title" className="text-lg font-semibold">Implantações E-Docs observadas</h2><p className="mb-3 text-sm text-slate-600">Consulta somente leitura da primeira competência positiva identificada na API oficial.</p><EdocsFilters><EdocsTextFilter label="Pesquisar" value={search} onChange={setSearch} /><label className="text-xs font-medium text-slate-600">Ano<input className="mt-1 block w-28 rounded-md border bg-white px-3 py-2 text-sm" type="number" min={2024} value={year} onChange={event => setYear(event.target.value)} /></label><EdocsSelectFilter label="Mês" value={month} onChange={setMonth}><option value="">Todos</option>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{String(index + 1).padStart(2, "0")}</option>)}</EdocsSelectFilter></EdocsFilters><AdminDataTable rows={data?.results ?? []} columns={columns} getRowKey={row => row.id} sorting={[]} onSort={() => undefined} page={1} pageSize={100} pageSizeOptions={[100]} totalCount={data?.count ?? 0} hasPreviousPage={false} hasNextPage={false} onPageChange={() => undefined} onPageSizeChange={() => undefined} density={density} onDensityChange={setDensity} onResetView={() => setDensity("compact")} isLoading={isLoading} errorMessage={error ? getApiErrorMessage(error, "Não foi possível carregar as implantações observadas.") : null} onRetry={() => mutate()} emptyMessage="Nenhuma implantação observada para os filtros informados." /></section>;
}

const MUNICIPAL_BOOLEAN_FIELDS = [
  ["municipio_implantado", "Município implantado"],
  ["municipio_em_implantacao", "Município em implantação"],
  ["municipio_manifestou_interesse", "Manifestou interesse"],
  ["municipio_implantado_sem_uso_edocs", "Implantado sem uso do E-Docs"],
] as const;

function municipalIndicatorSummary(patriarca: PatriarcaEdocs) {
  const active = MUNICIPAL_BOOLEAN_FIELDS.filter(([field]) => patriarca[field]);
  if (!active.length) return "Indicadores legados: nenhum ativo";
  return `Indicadores legados (somente leitura): ${active.map(([, label]) => label).join(" · ")}`;
}

function SelecaoColetaDialog({
  patriarca,
  onClose,
  onSave,
}: {
  patriarca: PatriarcaEdocs;
  onClose: () => void;
  onSave: (justificativa: string) => Promise<void>;
}) {
  const [justification, setJustification] = useState("");
  const [saving, setSaving] = useState(false);
  const selecting = !patriarca.coletar_detalhes;

  return (
    <EdocsModal title="Alterar seleção para coleta" onClose={onClose}>
      <p className="mt-3 text-sm text-slate-600">
        {selecting ? "Selecionar" : "Remover"} <strong>{patriarca.nome}</strong>{" "}
        {selecting ? "para" : "das"} coletas detalhadas.
      </p>
      <label className="mt-4 block text-xs font-medium text-slate-600">
        Justificativa
        <textarea
          className="mt-1 block w-full rounded-md border border-slate-300 p-3 text-sm"
          rows={4}
          value={justification}
          onChange={(event) => setJustification(event.target.value)}
        />
      </label>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          disabled={!justification.trim() || saving}
          onClick={async () => {
            setSaving(true);
            await onSave(justification.trim());
            setSaving(false);
          }}
        >
          {saving ? "Salvando..." : "Confirmar alteração"}
        </Button>
      </div>
    </EdocsModal>
  );
}
