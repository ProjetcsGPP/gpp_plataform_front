"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Pencil,
  Plus,
  Trash2,
  Network,
  ArrowLeft,
} from "lucide-react";

import { AdminAlert } from "@/components/admin/AdminPage";
import { Button } from "@/components/ui/button";
import {
  createItemOrganograma,
  deleteItemOrganograma,
  listItensOrganograma,
  updateItemOrganograma,
} from "@/features/carga-org-lot/api";
import { ItemOrganogramaFormDialog } from "@/features/carga-org-lot/ItemOrganogramaFormDialog";
import type {
  ImportacaoPlanilha,
  ItemOrganograma,
  ItemOrganogramaPayload,
  ItemOrganogramaNode,
} from "@/features/carga-org-lot/model";
import {
  branchIds,
  buildOrganogramaTree,
} from "@/features/carga-org-lot/organogramaTree";
import { getApiErrorMessage } from "@/lib/apiErrors";
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
  const { can } = usePermissions();
  const { data, error, isLoading, mutate } = useSWR(
    ["carga-org-lot:itens-organograma", importacao.idimportacaoplanilha],
    () => listItensOrganograma(importacao.idimportacaoplanilha),
    { revalidateOnFocus: false },
  );
  const tree = useMemo(() => buildOrganogramaTree(data ?? []), [data]);
  const allBranchIds = useMemo(() => branchIds(tree), [tree]);
  const [collapsed, setCollapsed] = useState<Set<number>>(() => new Set());
  const [form, setForm] = useState<{ item?: ItemOrganograma } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  function toggle(id: number) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function saveItem(payload: ItemOrganogramaPayload) {
    if (form?.item) {
      await updateItemOrganograma(form.item.iditemorganograma, payload);
    } else {
      await createItemOrganograma(payload);
    }
    await mutate();
    setForm(null);
  }

  async function removeItem(item: ItemOrganograma) {
    if (!window.confirm(`Excluir definitivamente a unidade ${item.strsigla} e seus descendentes?`)) return;
    setActionError(null);
    try {
      await deleteItemOrganograma(item.iditemorganograma);
      await mutate();
    } catch (caught) {
      setActionError(getApiErrorMessage(caught, "Não foi possível excluir a unidade."));
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
            </div>
            <p className="mt-1 truncate text-sm text-slate-600">
              {importacao.strnomearquivo} · importação #{importacao.idimportacaoplanilha}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onClose} aria-label="Voltar à lista de arquivos">
            <ArrowLeft aria-hidden="true" /> Voltar aos arquivos
          </Button>
        </header>

        <div className="flex shrink-0 flex-wrap justify-end gap-2 border-b border-slate-200 bg-white px-5 py-3">
          {can(PERMISSIONS.ITEMORGANOGRAMA_ADD) && <Button size="sm" onClick={() => setForm({})}><Plus aria-hidden="true" /> Adicionar unidade</Button>}
          <Button variant="outline" size="sm" onClick={() => setCollapsed(new Set())} disabled={!allBranchIds.length}>
            <ChevronsUpDown aria-hidden="true" /> Expandir tudo
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCollapsed(new Set(allBranchIds))} disabled={!allBranchIds.length}>
            <ChevronsDownUp aria-hidden="true" /> Recolher tudo
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
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
          ) : tree.length ? (
            <ul className="min-w-[48rem] space-y-3" aria-label="Estrutura do organograma">
              {tree.map((node) => (
                <TreeNode key={node.iditemorganograma} node={node} depth={0} collapsed={collapsed} onToggle={toggle} canEdit={can(PERMISSIONS.ITEMORGANOGRAMA_CHANGE)} canDelete={can(PERMISSIONS.ITEMORGANOGRAMA_DELETE)} onEdit={(item) => setForm({ item })} onDelete={removeItem} />
              ))}
            </ul>
          ) : (
            <div className="py-16 text-center text-sm text-slate-500">Nenhuma unidade foi encontrada nesta importação.</div>
          )}
        </div>
      {form && <ItemOrganogramaFormDialog importacaoId={importacao.idimportacaoplanilha} item={form.item} items={data ?? []} onSave={saveItem} onCancel={() => setForm(null)} />}
    </section>
  );
}

function TreeNode({
  node,
  depth,
  collapsed,
  onToggle,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  node: ItemOrganogramaNode;
  depth: number;
  collapsed: Set<number>;
  onToggle: (id: number) => void;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (item: ItemOrganograma) => void;
  onDelete: (item: ItemOrganograma) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isCollapsed = collapsed.has(node.iditemorganograma);
  const level = depth + 1;

  return (
    <li>
      <div
        className="flex w-full items-center gap-3 rounded-lg border border-black/5 px-3 py-2.5 text-left text-slate-900 shadow-sm transition hover:brightness-[0.98]"
        style={{ backgroundColor: LEVEL_COLORS[depth] ?? "#ffffff" }}
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
            Nível {level} · nº {node.strnumero || "—"} · {node.strabaorigem || "Aba não informada"}, linha {node.intlinhaorigem}
          </span>
          {node.strreferenciapai && (
            <span className="block truncate text-xs text-slate-500">
              Pai informado na planilha: {node.strreferenciapai}
            </span>
          )}
        </span>
        {canEdit && <Button variant="ghost" size="icon-sm" onClick={() => onEdit(node)} aria-label={`Editar ${node.strsigla}`}><Pencil aria-hidden="true" /></Button>}
        {canDelete && <Button variant="ghost" size="icon-sm" className="text-red-700" onClick={() => onDelete(node)} aria-label={`Excluir ${node.strsigla}`}><Trash2 aria-hidden="true" /></Button>}
      </div>

      {hasChildren && !isCollapsed && (
        <ul className="ml-5 mt-3 space-y-3 border-l-2 border-dashed border-slate-300 pl-5">
          {node.children.map((child) => (
            <TreeNode key={child.iditemorganograma} node={child} depth={depth + 1} collapsed={collapsed} onToggle={onToggle} canEdit={canEdit} canDelete={canDelete} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </ul>
      )}
    </li>
  );
}
