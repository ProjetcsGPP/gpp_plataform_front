"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ImportacaoPlanilha } from "@/features/carga-org-lot/model";

export function DeleteImportacaoDialog({
  importacao,
  isDeleting,
  onConfirm,
  onCancel,
}: {
  importacao: ImportacaoPlanilha;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-import-title">
      <section className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-red-100 p-2 text-red-700"><AlertTriangle aria-hidden="true" /></div>
            <div>
              <h2 id="delete-import-title" className="text-lg font-bold text-slate-900">Excluir versão importada?</h2>
              <p className="mt-2 text-sm text-slate-700">
                A exclusão de <strong>{importacao.strnomearquivo}</strong> é definitiva e removerá o arquivo armazenado e todos os itens de organograma vinculados.
              </p>
              <p className="mt-2 text-sm font-semibold text-red-700">Essa operação não pode ser desfeita.</p>
            </div>
          </div>
        </div>
        <footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button variant="outline" onClick={onCancel} disabled={isDeleting}>Cancelar</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "Excluindo..." : "Excluir definitivamente"}
          </Button>
        </footer>
      </section>
    </div>
  );
}
