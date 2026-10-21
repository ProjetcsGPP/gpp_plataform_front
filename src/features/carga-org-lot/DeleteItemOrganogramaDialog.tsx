"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ItemOrganograma, ItemOrganogramaImpacto } from "@/features/carga-org-lot/model";

export function DeleteItemOrganogramaDialog({
  item,
  impacto,
  isDeleting,
  onConfirm,
  onCancel,
}: {
  item: ItemOrganograma;
  impacto: ItemOrganogramaImpacto;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-item-title">
      <section className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-red-100 p-2 text-red-700"><AlertTriangle aria-hidden="true" /></div>
            <div>
              <h2 id="delete-item-title" className="text-lg font-bold text-slate-900">Excluir unidade?</h2>
              {impacto.total_descendentes > 0 ? <p className="mt-2 text-sm text-slate-700">A unidade <strong>“{item.strsigla}”</strong> possui <strong>{impacto.total_descendentes}</strong> unidades subordinadas. Esta ação excluirá permanentemente <strong>{impacto.total_excluidos}</strong> unidades do organograma.</p> : <p className="mt-2 text-sm text-slate-700">A unidade <strong>{item.strsigla} - {item.strnome}</strong> será excluída permanentemente.</p>}
              <p className="mt-2 text-sm font-semibold text-red-700">Essa operação não pode ser desfeita.</p>
            </div>
          </div>
        </div>
        <footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button variant="outline" onClick={onCancel} disabled={isDeleting}>Cancelar</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>{isDeleting ? "Excluindo..." : "Excluir definitivamente"}</Button>
        </footer>
      </section>
    </div>
  );
}
