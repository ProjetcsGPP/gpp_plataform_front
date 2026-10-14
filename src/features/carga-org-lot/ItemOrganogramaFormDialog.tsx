"use client";

import { useState, type FormEvent } from "react";

import { AdminAlert } from "@/components/admin/AdminPage";
import { Button } from "@/components/ui/button";
import type {
  ItemOrganograma,
  ItemOrganogramaPayload,
} from "@/features/carga-org-lot/model";
import { getApiErrorMessage } from "@/lib/apiErrors";

export function ItemOrganogramaFormDialog({
  importacaoId,
  item,
  items,
  onSave,
  onCancel,
}: {
  importacaoId: number;
  item?: ItemOrganograma;
  items: ItemOrganograma[];
  onSave: (payload: ItemOrganogramaPayload) => Promise<void>;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<ItemOrganogramaPayload>({
    idimportacaoplanilha_id: importacaoId,
    idpai_id: item?.idpai_id ?? null,
    strnome: item?.strnome ?? "",
    strsigla: item?.strsigla ?? "",
    strnumero: item?.strnumero ?? "",
    strreferenciapai: item?.strreferenciapai ?? "",
    strabaorigem: item?.strabaorigem ?? "",
    intlinhaorigem: item?.intlinhaorigem ?? 1,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      await onSave({ ...values, strsigla: values.strsigla.toUpperCase() });
    } catch (caught) {
      setError(getApiErrorMessage(caught, "Não foi possível salvar a unidade."));
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="item-form-title">
      <form onSubmit={submit} className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-xl bg-white shadow-2xl">
        <header className="border-b border-slate-200 px-6 py-4">
          <h2 id="item-form-title" className="text-lg font-bold text-slate-900">{item ? "Editar unidade" : "Adicionar unidade"}</h2>
        </header>
        <div className="grid gap-4 p-6 sm:grid-cols-2">
          {error && <div className="sm:col-span-2"><AdminAlert>{error}</AdminAlert></div>}
          <Field label="Número"><input required value={values.strnumero} onChange={(event) => setValues({ ...values, strnumero: event.target.value })} className={inputClass} /></Field>
          <Field label="Sigla"><input required value={values.strsigla} onChange={(event) => setValues({ ...values, strsigla: event.target.value })} className={inputClass} /></Field>
          <Field label="Nome" wide><input required value={values.strnome} onChange={(event) => setValues({ ...values, strnome: event.target.value })} className={inputClass} /></Field>
          <Field label="Unidade pai">
            <select value={values.idpai_id ?? ""} onChange={(event) => setValues({ ...values, idpai_id: event.target.value ? Number(event.target.value) : null })} className={inputClass}>
              <option value="">Raiz</option>
              {items.filter((candidate) => candidate.iditemorganograma !== item?.iditemorganograma).map((candidate) => (
                <option key={candidate.iditemorganograma} value={candidate.iditemorganograma}>{candidate.strnumero} - {candidate.strsigla}</option>
              ))}
            </select>
          </Field>
          <Field label="Referência do pai"><input value={values.strreferenciapai} onChange={(event) => setValues({ ...values, strreferenciapai: event.target.value })} className={inputClass} /></Field>
          <Field label="Aba de origem"><input required value={values.strabaorigem} onChange={(event) => setValues({ ...values, strabaorigem: event.target.value })} className={inputClass} /></Field>
          <Field label="Linha de origem"><input required min={1} type="number" value={values.intlinhaorigem} onChange={(event) => setValues({ ...values, intlinhaorigem: Number(event.target.value) })} className={inputClass} /></Field>
        </div>
        <footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>Cancelar</Button>
          <Button type="submit" disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar"}</Button>
        </footer>
      </form>
    </div>
  );
}

const inputClass = "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900";

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={`text-sm text-slate-700 ${wide ? "sm:col-span-2" : ""}`}>{label}{children}</label>;
}
