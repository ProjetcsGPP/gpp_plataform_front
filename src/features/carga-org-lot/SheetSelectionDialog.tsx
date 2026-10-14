"use client";

import { useState } from "react";
import { Layers3, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SheetSelectionReport } from "@/features/carga-org-lot/model";

export function SheetSelectionDialog({
  report,
  isSubmitting,
  onConfirm,
  onCancel,
}: {
  report: SheetSelectionReport;
  isSubmitting: boolean;
  onConfirm: (sheet: string) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState("");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheet-selection-title"
    >
      <section className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers3 className="size-5 text-app-primary" aria-hidden="true" />
              <h2 id="sheet-selection-title" className="text-lg font-bold text-slate-900">
                Selecione a aba do organograma
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-600">{report.mensagem}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel} disabled={isSubmitting} aria-label="Cancelar seleção de aba">
            <X aria-hidden="true" />
          </Button>
        </header>

        <fieldset className="space-y-3 p-6">
          <legend className="sr-only">Abas disponíveis</legend>
          {report.abas.map((sheet) => (
            <label
              key={`${sheet.ordem}-${sheet.nome}`}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4 hover:bg-slate-50"
            >
              <input
                type="radio"
                name="organograma-sheet"
                value={sheet.nome}
                checked={selected === sheet.nome}
                onChange={() => setSelected(sheet.nome)}
                className="mt-1"
              />
              <span>
                <span className="block font-semibold text-slate-900">{sheet.nome}</span>
                <span className="block text-sm text-slate-600">
                  Aba {sheet.ordem} · {sheet.linhas_preenchidas} linhas preenchidas
                </span>
              </span>
            </label>
          ))}
        </fieldset>

        <footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
          <Button onClick={() => onConfirm(selected)} disabled={!selected || isSubmitting}>
            {isSubmitting ? "Importando..." : "Importar aba selecionada"}
          </Button>
        </footer>
      </section>
    </div>
  );
}
