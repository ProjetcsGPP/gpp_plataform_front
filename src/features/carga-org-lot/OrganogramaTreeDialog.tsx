"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import useSWR, { useSWRConfig } from "swr";
import {
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Pencil,
  Plus,
  Trash2,
  Network,
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Search,
  Download,
  AlertTriangle,
  LayoutGrid,
  ListTree,
} from "lucide-react";

import { AdminAlert } from "@/components/admin/AdminPage";
import { Button } from "@/components/ui/button";
import {
  createItemOrganograma,
  deleteItemOrganograma,
  downloadArquivo,
  getImpactoExclusaoItem,
  getImportacao,
  getSubtreeConfirmationImpact,
  importacaoKey,
  listItensOrganograma,
  processoAtivoKey,
  updateItemOrganograma,
} from "@/features/carga-org-lot/api";
import { ItemOrganogramaFormDialog } from "@/features/carga-org-lot/ItemOrganogramaFormDialog";
import { DeleteItemOrganogramaDialog } from "@/features/carga-org-lot/DeleteItemOrganogramaDialog";
import { MoveItemOrganogramaDialog } from "@/features/carga-org-lot/MoveItemOrganogramaDialog";
import type {
  ImportacaoPlanilha,
  ItemOrganograma,
  ItemOrganogramaCreatePayload,
  ItemOrganogramaImpacto,
  ItemOrganogramaNode,
  ItemOrganogramaUpdatePayload,
} from "@/features/carga-org-lot/model";
import {
  branchIds,
  buildOrganogramaTree,
  flattenOrganogramaTree,
  ancestorIds,
} from "@/features/carga-org-lot/organogramaTree";
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/apiErrors";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/lib/permissions";

const LEVEL_COLORS = [
  "#bbdefb",
  "#b3e5fc",
  "#b2ebf2",
  "#b2dfdb",
  "#c8e6c9",
  "#dcedc8",
  "#f0f4c3",
];

export function OrganogramaTreePanel({
  importacao,
  onClose,
}: {
  importacao: ImportacaoPlanilha;
  onClose: () => void;
}) {
  const { mutate: mutateCache } = useSWRConfig();
  const { can } = usePermissions();
  const { data, error, isLoading, mutate } = useSWR(
    ["carga-org-lot:itens-organograma", importacao.idimportacaoplanilha],
    () => listItensOrganograma(importacao.idimportacaoplanilha),
    { revalidateOnFocus: false },
  );
  const { data: refreshedImportacao, mutate: mutateImportacao } = useSWR(
    importacaoKey(importacao.idimportacaoplanilha),
    () => getImportacao(importacao.idimportacaoplanilha),
    { fallbackData: importacao, revalidateOnFocus: false },
  );
  const currentImportacao = refreshedImportacao ?? importacao;
  const tree = useMemo(() => buildOrganogramaTree(data ?? []), [data]);
  const organizationOptions = useMemo(
    () => tree.length === 1 && tree[0].children.length ? tree[0].children : tree,
    [tree],
  );
  const [viewMode, setViewMode] = useState<"all" | "organizations">("all");
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<number | null>(null);
  const displayedTree = useMemo(() => {
    if (viewMode === "all" || selectedOrganizationId === null) return tree;
    const selected = organizationOptions.find(
      (item) => item.iditemorganograma === selectedOrganizationId,
    );
    return selected ? [selected] : tree;
  }, [organizationOptions, selectedOrganizationId, tree, viewMode]);
  const selectedOrganization = useMemo(
    () => organizationOptions.find(
      (item) => item.iditemorganograma === selectedOrganizationId,
    ) ?? null,
    [organizationOptions, selectedOrganizationId],
  );
  const isOrganizationPicker = viewMode === "organizations" && selectedOrganization === null;
  const orderedItems = useMemo(
    () => flattenOrganogramaTree(displayedTree),
    [displayedTree],
  );
  const allBranchIds = useMemo(() => branchIds(displayedTree), [displayedTree]);
  const [collapsed, setCollapsed] = useState<Set<number>>(() => new Set());
  const [form, setForm] = useState<{
    item?: ItemOrganograma;
    initialParentId?: number | null;
  } | null>(null);
  const [formFieldErrors, setFormFieldErrors] = useState<{
    strsigla?: string;
    strnome?: string;
  }>({});
  const [deletingItem, setDeletingItem] = useState<ItemOrganograma | null>(null);
  const [deletionImpact, setDeletionImpact] = useState<ItemOrganogramaImpacto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingMove, setPendingMove] = useState<{ item: ItemOrganograma; payload: ItemOrganogramaUpdatePayload; impacto: ItemOrganogramaImpacto } | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [matchIds, setMatchIds] = useState<number[]>([]);
  const [activeMatchIndex, setActiveMatchIndex] = useState(-1);
  const [missingSearch, setMissingSearch] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<number, HTMLDivElement>());

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  useEffect(() => {
    if (
      selectedOrganizationId !== null
      && !organizationOptions.some(
        (item) => item.iditemorganograma === selectedOrganizationId,
      )
    ) {
      setSelectedOrganizationId(null);
    }
  }, [organizationOptions, selectedOrganizationId]);

  function toggle(id: number) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function focusMatch(matches: number[], index: number) {
    const itemId = matches[index];
    const ancestors = ancestorIds(data ?? [], itemId);
    setCollapsed((current) => {
      const next = new Set(current);
      ancestors.forEach((id) => next.delete(id));
      return next;
    });
    setActiveMatchIndex(index);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      const element = itemRefs.current.get(itemId);
      if (!container || !element) return;
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      container.scrollTo({
        top: container.scrollTop + elementRect.top - containerRect.top
          - (container.clientHeight - elementRect.height) / 2,
        behavior: "smooth",
      });
    }));
  }

  function searchItems(event: FormEvent) {
    event.preventDefault();
    const normalizedQuery = normalizeSearch(searchQuery.trim());
    if (!normalizedQuery) return;
    const matches = orderedItems
      .filter((item) => normalizeSearch(item.strsigla).includes(normalizedQuery)
        || normalizeSearch(item.strnome).includes(normalizedQuery))
      .map((item) => item.iditemorganograma);
    if (!matches.length) {
      setMatchIds([]);
      setActiveMatchIndex(-1);
      setMissingSearch(searchQuery.trim());
      return;
    }
    setMatchIds(matches);
    focusMatch(matches, 0);
  }

  function changeSearch(value: string) {
    setSearchQuery(value);
    setMatchIds([]);
    setActiveMatchIndex(-1);
  }

  function selectOrganization(id: number | null) {
    setSelectedOrganizationId(id);
    setMatchIds([]);
    setActiveMatchIndex(-1);
    setCollapsed(new Set());
    window.requestAnimationFrame(() => {
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
    });
  }

  function changeViewMode(mode: "all" | "organizations") {
    setViewMode(mode);
    selectOrganization(null);
    setSearchQuery("");
  }

  async function revalidateWorkflow() {
    const scrollTop = scrollContainerRef.current?.scrollTop ?? 0;
    await Promise.all([
      mutate(),
      mutateImportacao(),
      mutateCache(processoAtivoKey(importacao.idpatriarca_id)),
      mutateCache((key) => Array.isArray(key) && key[0] === "carga-org-lot:importacoes"),
      mutateCache((key) => Array.isArray(key) && key[0] === "carga-org-lot:organogramas-disponiveis"),
      mutateCache((key) => Array.isArray(key) && key[0] === "carga-org-lot:patriarcas"),
    ]);
    window.requestAnimationFrame(() => {
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = scrollTop;
    });
  }

  async function persistItem(payload: ItemOrganogramaCreatePayload | ItemOrganogramaUpdatePayload) {
    if (form?.item) {
      await updateItemOrganograma(
        form.item.iditemorganograma,
        payload as ItemOrganogramaUpdatePayload,
      );
    } else {
      await createItemOrganograma(payload as ItemOrganogramaCreatePayload);
    }
    await revalidateWorkflow();
    setFormFieldErrors({});
    setForm(null);
  }

  async function saveItem(payload: ItemOrganogramaCreatePayload | ItemOrganogramaUpdatePayload) {
    if (form?.item && payload.idpai_id !== form.item.idpai_id) {
      const impacto = await getImpactoExclusaoItem(form.item.iditemorganograma);
      if (impacto.total_descendentes > 0) {
        setPendingMove({ item: form.item, payload: payload as ItemOrganogramaUpdatePayload, impacto });
        return false;
      }
    }
    await persistItem(payload);
  }

  async function confirmMove() {
    if (!pendingMove) return;
    setIsMoving(true);
    try {
      await persistItem(pendingMove.payload);
      setPendingMove(null);
    } catch (caught) {
      const fieldErrors = getApiFieldErrors(caught);
      if (fieldErrors.strsigla?.length) {
        setFormFieldErrors({ strsigla: fieldErrors.strsigla.join(" ") });
        setPendingMove(null);
      } else {
        setActionError(getApiErrorMessage(caught, "Não foi possível movimentar a estrutura."));
      }
    } finally {
      setIsMoving(false);
    }
  }

  async function prepareDelete(item: ItemOrganograma) {
    setActionError(null);
    try {
      const impacto = await getImpactoExclusaoItem(item.iditemorganograma);
      setDeletingItem(item);
      setDeletionImpact(impacto);
    } catch (caught) {
      setActionError(getApiErrorMessage(caught, "Não foi possível calcular o impacto da exclusão."));
    }
  }

  async function removeItem() {
    if (!deletingItem || !deletionImpact) return;
    setIsDeleting(true);
    setActionError(null);
    try {
      await deleteItemOrganograma(
        deletingItem.iditemorganograma,
        deletionImpact.total_descendentes > 0,
      );
      await revalidateWorkflow();
      setDeletingItem(null);
      setDeletionImpact(null);
    } catch (caught) {
      const confirmationImpact = getSubtreeConfirmationImpact(caught);
      if (confirmationImpact) {
        setDeletionImpact(confirmationImpact);
        return;
      }
      setActionError(getApiErrorMessage(caught, "Não foi possível excluir a unidade."));
      setDeletingItem(null);
      setDeletionImpact(null);
    } finally {
      setIsDeleting(false);
    }
  }

  async function download(url: string, name: string) {
    setActionError(null);
    try {
      await downloadArquivo(url, name);
    } catch (caught) {
      setActionError(getApiErrorMessage(caught, "Não foi possível baixar o arquivo."));
    }
  }

  return (
    <section
      className="flex h-[calc(100dvh-15rem)] w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm"
      role="region"
      aria-labelledby="organograma-tree-title"
    >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Network className="size-5 text-app-primary" aria-hidden="true" />
              <h2 id="organograma-tree-title" className="truncate text-lg font-bold text-slate-900">
                Organograma lido
              </h2>
              {currentImportacao.flgpossuialteracoes && (
                <ManualChangesMark />
              )}
            </div>
            <p className="mt-1 truncate text-sm text-slate-600">
              {currentImportacao.strnomearquivo} · importação #{currentImportacao.idimportacaoplanilha}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {can(PERMISSIONS.IMPORTACAOPLANILHA_VIEW) && <Button variant="outline" size="sm" onClick={() => download(currentImportacao.download_url, currentImportacao.strnomearquivo)}><Download aria-hidden="true" /> Planilha original</Button>}
            {can(PERMISSIONS.IMPORTACAOPLANILHA_VIEW) && currentImportacao.flgpossuialteracoes && currentImportacao.organograma_atualizado_download_url && <Button variant="outline" size="sm" onClick={() => download(currentImportacao.organograma_atualizado_download_url!, `organograma-atualizado-${currentImportacao.patriarca.strsiglapatriarca}.xlsx`)}><Download aria-hidden="true" /> Organograma atualizado</Button>}
            <Button variant="outline" size="sm" onClick={onClose} aria-label="Voltar à lista de arquivos"><ArrowLeft aria-hidden="true" /> Voltar aos arquivos</Button>
          </div>
        </header>

        {currentImportacao.processo?.strstatuslotacao === "DESATUALIZADA" && <div className="shrink-0 border-b border-orange-300 bg-orange-50 px-5 py-3 text-sm font-medium text-orange-900">As lotações estão desatualizadas após a alteração do organograma.</div>}

        <div className="flex shrink-0 flex-wrap items-end justify-between gap-3 border-b border-slate-200 bg-white px-5 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex overflow-hidden rounded-lg border border-slate-300" role="group" aria-label="Modo de visualização">
              <Button type="button" variant={viewMode === "all" ? "default" : "ghost"} size="sm" className="rounded-none border-0" aria-pressed={viewMode === "all"} onClick={() => changeViewMode("all")}><ListTree aria-hidden="true" /> Visualizar tudo</Button>
              <Button type="button" variant={viewMode === "organizations" ? "default" : "ghost"} size="sm" className="rounded-none border-0 border-l border-slate-300" aria-pressed={viewMode === "organizations"} onClick={() => changeViewMode("organizations")}><LayoutGrid aria-hidden="true" /> Visualizar por órgão</Button>
            </div>
            <form onSubmit={searchItems} className="flex flex-wrap items-end gap-2">
              <label className="text-sm text-slate-700">Pesquisar unidade
                <input value={searchQuery} onChange={(event) => changeSearch(event.target.value)} disabled={isOrganizationPicker} placeholder="Sigla ou parte do nome" className="mt-1 block w-72 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400" />
              </label>
              <Button type="submit" variant="outline" size="sm" disabled={isOrganizationPicker || !searchQuery.trim()}><Search aria-hidden="true" /> Pesquisar</Button>
              {matchIds.length > 0 && <div className="flex items-center gap-1" aria-label="Navegação dos resultados">
                <Button type="button" variant="outline" size="icon-sm" aria-label="Resultado anterior" disabled={activeMatchIndex <= 0} onClick={() => focusMatch(matchIds, activeMatchIndex - 1)}><ArrowUp aria-hidden="true" /></Button>
                <span className="min-w-14 text-center text-xs font-medium text-slate-600">{activeMatchIndex + 1} de {matchIds.length}</span>
                <Button type="button" variant="outline" size="icon-sm" aria-label="Próximo resultado" disabled={activeMatchIndex >= matchIds.length - 1} onClick={() => focusMatch(matchIds, activeMatchIndex + 1)}><ArrowDown aria-hidden="true" /></Button>
              </div>}
            </form>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
          {can(PERMISSIONS.ITEMORGANOGRAMA_ADD) && <Button size="sm" onClick={() => { setFormFieldErrors({}); setForm({}); }}><Plus aria-hidden="true" /> Adicionar unidade</Button>}
          <Button variant="outline" size="sm" onClick={() => setCollapsed(new Set())} disabled={isOrganizationPicker || !allBranchIds.length}>
            <ChevronsUpDown aria-hidden="true" /> Expandir tudo
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCollapsed(new Set(allBranchIds))} disabled={isOrganizationPicker || !allBranchIds.length}>
            <ChevronsDownUp aria-hidden="true" /> Recolher tudo
          </Button>
          </div>
        </div>

        <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
          {actionError && <div className="mb-4"><AdminAlert>{actionError}</AdminAlert></div>}
          {isLoading ? (
            <div className="py-16 text-center text-sm text-slate-500">Carregando unidades do organograma...</div>
          ) : error ? (
            <AdminAlert>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>{getApiErrorMessage(error, "Não foi possível carregar os itens do organograma.")}</span>
                <Button variant="outline" size="sm" onClick={() => mutate()}>Tentar novamente</Button>
              </div>
            </AdminAlert>
          ) : isOrganizationPicker ? (
            <OrganizationPicker
              organizations={organizationOptions}
              patriarchAcronym={currentImportacao.patriarca?.strsiglapatriarca}
              onSelect={selectOrganization}
            />
          ) : displayedTree.length ? (
            <div>
              {viewMode === "organizations" && selectedOrganization && (
                <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <Button type="button" variant="outline" size="sm" onClick={() => selectOrganization(null)}><ArrowLeft aria-hidden="true" /> Voltar aos órgãos</Button>
                  <div className="min-w-0">
                    <p className="truncate text-base font-extrabold tracking-wide text-app-primary">{selectedOrganization.strsigla || "Sem sigla"}</p>
                    <p className="truncate text-xs text-slate-600">{selectedOrganization.strnome}</p>
                  </div>
                </div>
              )}
              <ul className="min-w-[48rem] space-y-3" aria-label="Estrutura do organograma">
                {displayedTree.map((node) => (
                  <TreeNode key={node.iditemorganograma} node={node} depth={viewMode === "organizations" ? 1 : 0} collapsed={collapsed} onToggle={toggle} canAdd={can(PERMISSIONS.ITEMORGANOGRAMA_ADD)} canEdit={can(PERMISSIONS.ITEMORGANOGRAMA_CHANGE)} canDelete={can(PERMISSIONS.ITEMORGANOGRAMA_DELETE)} onAdd={(item) => { setFormFieldErrors({}); setForm({ initialParentId: item.iditemorganograma }); }} onEdit={(item) => { setFormFieldErrors({}); setForm({ item }); }} onDelete={prepareDelete} activeItemId={matchIds[activeMatchIndex]} registerItem={(id, element) => element ? itemRefs.current.set(id, element) : itemRefs.current.delete(id)} />
                ))}
              </ul>
            </div>
          ) : (
            <div className="py-16 text-center text-sm text-slate-500">Nenhuma unidade foi encontrada nesta importação.</div>
          )}
        </div>
      {form && <ItemOrganogramaFormDialog importacaoId={importacao.idimportacaoplanilha} item={form.item} initialParentId={form.initialParentId} items={data ?? []} backendFieldErrors={formFieldErrors} onSave={saveItem} onCancel={() => { setFormFieldErrors({}); setForm(null); }} />}
      {deletingItem && deletionImpact && <DeleteItemOrganogramaDialog item={deletingItem} impacto={deletionImpact} isDeleting={isDeleting} onCancel={() => { setDeletingItem(null); setDeletionImpact(null); }} onConfirm={removeItem} />}
      {pendingMove && <MoveItemOrganogramaDialog item={pendingMove.item} impacto={pendingMove.impacto} isMoving={isMoving} onCancel={() => setPendingMove(null)} onConfirm={confirmMove} />}
      {missingSearch && <SearchNotFoundDialog query={missingSearch} onClose={() => setMissingSearch(null)} />}
    </section>
  );
}

function OrganizationPicker({
  organizations,
  patriarchAcronym,
  onSelect,
}: {
  organizations: ItemOrganogramaNode[];
  patriarchAcronym?: string;
  onSelect: (id: number) => void;
}) {
  const totalLabel = `${organizations.length} ${organizations.length === 1 ? "órgão" : "órgãos"}`;

  return (
    <section
      className="min-h-full w-full rounded-xl border border-sky-200 bg-sky-50 p-4 shadow-sm sm:p-6"
      aria-labelledby="organization-picker-title"
    >
      <h3 id="organization-picker-title" className="mb-5 text-center text-xl font-bold text-slate-800">
        <span className="text-app-primary">{totalLabel}</span>
        {patriarchAcronym ? ` em ${patriarchAcronym}` : " no organograma"}
      </h3>
      {organizations.length ? (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label="Órgãos do organograma">
          {organizations.map((organization) => (
            <li key={organization.iditemorganograma}>
              <button
                type="button"
                aria-label={`Visualizar ${organization.strsigla || "órgão sem sigla"} - ${organization.strnome}`}
                onClick={() => onSelect(organization.iditemorganograma)}
                className="h-full min-h-28 w-full rounded-sm border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition hover:border-app-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary focus-visible:ring-offset-2"
              >
                <span className="block truncate text-xl font-extrabold tracking-wide text-app-primary">
                  {organization.strsigla || "Sem sigla"}
                </span>
                <span className="mt-1 block text-xs font-medium leading-5 text-slate-600">
                  {organization.strnome}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-16 text-center text-sm text-slate-500">
          Nenhum órgão foi encontrado nesta importação.
        </p>
      )}
    </section>
  );
}

function ManualChangesMark() {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative z-30 inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-amber-300 bg-amber-50 text-amber-800 outline-none transition hover:bg-amber-100 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
        aria-label="Organograma com alterações manuais"
        aria-describedby={open ? "manual-changes-tooltip" : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((current) => !current)}
      >
        <AlertTriangle className="size-4" aria-hidden="true" />
      </button>
      {open && (
        <span
          id="manual-changes-tooltip"
          role="tooltip"
          className="absolute left-1/2 top-full mt-2 w-72 -translate-x-1/2 rounded-lg bg-slate-950 px-3 py-2 text-left text-xs leading-5 text-white shadow-lg"
        >
          <strong className="block font-semibold">Organograma com alterações manuais</strong>
          A planilha original foi preservada. Baixe o organograma atualizado para obter a estrutura atual.
        </span>
      )}
    </span>
  );
}

function TreeNode({
  node,
  depth,
  collapsed,
  onToggle,
  canAdd,
  canEdit,
  canDelete,
  onAdd,
  onEdit,
  onDelete,
  activeItemId,
  registerItem,
}: {
  node: ItemOrganogramaNode;
  depth: number;
  collapsed: Set<number>;
  onToggle: (id: number) => void;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onAdd: (item: ItemOrganograma) => void;
  onEdit: (item: ItemOrganograma) => void;
  onDelete: (item: ItemOrganograma) => void;
  activeItemId?: number;
  registerItem: (id: number, element: HTMLDivElement | null) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isCollapsed = collapsed.has(node.iditemorganograma);
  const level = depth + 1;
  const secondaryDetails = [
    depth === 0 ? "Patriarca" : `Nível ${level}`,
    depth === 0 ? "" : `nº ${node.strnumero || "—"}`,
    node.strresponsavel,
    node.strcargo,
  ]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(" · ");

  return (
    <li>
      <div
        ref={(element) => registerItem(node.iditemorganograma, element)}
        className={`flex w-full items-center gap-3 rounded-lg border border-black/5 px-3 py-2.5 text-left text-slate-900 shadow-sm transition hover:brightness-[0.98] ${activeItemId === node.iditemorganograma ? "ring-2 ring-app-primary ring-offset-2" : ""}`}
        style={{ backgroundColor: LEVEL_COLORS[depth] ?? "#ffffff" }}
        aria-current={activeItemId === node.iditemorganograma ? "true" : undefined}
      >
        <button type="button" onClick={() => hasChildren && onToggle(node.iditemorganograma)} aria-label={hasChildren ? `${isCollapsed ? "Expandir" : "Recolher"} ${node.strsigla}` : undefined} aria-expanded={hasChildren ? !isCollapsed : undefined} className={hasChildren ? "rounded p-1 hover:bg-white/40" : "invisible p-1"}>
          <ChevronRight className={`size-4 shrink-0 transition-transform ${hasChildren && !isCollapsed ? "rotate-90" : ""}`} aria-hidden="true" />
        </button>
        <span className="shrink-0 rounded-md bg-white/55 px-2.5 py-1 text-sm font-extrabold tracking-wide ring-1 ring-black/5">
          {node.strsigla || "Sem sigla"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold">{node.strnome}</span>
          <span className="block truncate text-xs text-slate-600">
            {secondaryDetails}
          </span>
          {node.strreferenciapai && (
            <span className="block truncate text-xs text-slate-500">
              Pai informado na planilha: {node.strreferenciapai}
            </span>
          )}
        </span>
        {canAdd && <Button variant="ghost" size="sm" onClick={() => onAdd(node)} aria-label={`Adicionar unidade abaixo de ${node.strsigla}`}><Plus aria-hidden="true" /> Adicionar Unidade Abaixo</Button>}
        {canEdit && <Button variant="ghost" size="sm" onClick={() => onEdit(node)} aria-label={`Editar ${node.strsigla}`}><Pencil aria-hidden="true" /> Editar</Button>}
        {canDelete && <Button variant="ghost" size="sm" className="text-red-700" onClick={() => onDelete(node)} aria-label={`Excluir ${node.strsigla}`}><Trash2 aria-hidden="true" /> Excluir</Button>}
      </div>

      {hasChildren && !isCollapsed && (
        <ul className="ml-5 mt-3 space-y-3 border-l-2 border-dashed border-slate-300 pl-5">
          {node.children.map((child) => (
            <TreeNode key={child.iditemorganograma} node={child} depth={depth + 1} collapsed={collapsed} onToggle={onToggle} canAdd={canAdd} canEdit={canEdit} canDelete={canDelete} onAdd={onAdd} onEdit={onEdit} onDelete={onDelete} activeItemId={activeItemId} registerItem={registerItem} />
          ))}
        </ul>
      )}
    </li>
  );
}

function SearchNotFoundDialog({ query, onClose }: { query: string; onClose: () => void }) {
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4" role="dialog" aria-modal="true" aria-labelledby="search-not-found-title"><section className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl"><div className="p-6"><h2 id="search-not-found-title" className="text-lg font-bold text-slate-900">Nenhuma unidade encontrada</h2><p className="mt-2 text-sm text-slate-700">Não encontramos sigla ou nome contendo <strong>“{query}”</strong>.</p></div><footer className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4"><Button onClick={onClose}>Entendi</Button></footer></section></div>;
}

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleUpperCase("pt-BR");
}
