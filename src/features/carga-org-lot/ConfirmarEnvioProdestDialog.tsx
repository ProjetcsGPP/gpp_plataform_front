"use client";

import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ImportacaoPlanilha } from "@/features/carga-org-lot/model";
import { formatAdminDate } from "@/lib/adminResource";

export function ConfirmarEnvioProdestDialog({
  importacao,
  isSubmitting,
  onCancel,
  onConfirm,
}: {
  importacao: ImportacaoPlanilha;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-prodest-title">
      <section className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-blue-100 p-2 text-blue-800"><Send aria-hidden="true" /></div>
            <div>
              <h2 id="confirm-prodest-title" className="text-lg font-bold text-slate-900">Enviar definitivamente para a PRODEST?</h2>
              <p className="mt-2 text-sm text-slate-700">
                O conteúdo será efetivamente processado pela PRODEST. O organograma poderá ser reenviado futuramente, se necessário.
              </p>
            </div>
          </div>
          <dl className="mt-5 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
            <Info label="Patriarca" value={`${importacao.patriarca.strsiglapatriarca} - ${importacao.patriarca.strnome}`} />
            <Info label="Referência" value={importacao.strreferencia || "Sem referência"} />
            <Info label="Arquivo" value={importacao.strnomearquivo} />
            <Info label="Data da importação" value={formatAdminDate(importacao.datimportacao)} />
          </dl>
        </div>
        <footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            <Send aria-hidden="true" /> {isSubmitting ? "Enviando..." : "Confirmar envio definitivo"}
          </Button>
        </footer>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 text-slate-800">{value}</dd></div>;
}
