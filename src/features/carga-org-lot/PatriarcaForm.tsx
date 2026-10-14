"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import { Loader2, Save } from "lucide-react";

import { AdminAlert, AdminPanel } from "@/components/admin/AdminPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createPatriarca,
  listStatusProgresso,
  updatePatriarca,
} from "@/features/carga-org-lot/api";
import type { Patriarca } from "@/features/carga-org-lot/model";
import { usePatriarcaSelection } from "@/features/carga-org-lot/usePatriarcaSelection";
import { getApiErrorMessage } from "@/lib/apiErrors";

export function PatriarcaForm({ record }: { record?: Patriarca }) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { selected, select } = usePatriarcaSelection();
  const { data: statuses, error: statusError } = useSWR(
    record ? null : "/carga-org-lot/status-progresso/",
    listStatusProgresso,
    { revalidateOnFocus: false },
  );
  const novoStatus = statuses?.find(
    (status) => status.strdescricao.trim().toLocaleUpperCase("pt-BR") === "NOVO",
  );
  const [values, setValues] = useState({
    idexternopatriarca: record?.idexternopatriarca ?? "",
    strsiglapatriarca: record?.strsiglapatriarca ?? "",
    strnome: record?.strnome ?? "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values.idexternopatriarca.trim() || !values.strsiglapatriarca.trim() ||
        !values.strnome.trim()) {
      setError("Preencha todos os campos do patriarca.");
      return;
    }
    if (!record && !novoStatus) {
      setError('O status "Novo" não está disponível no catálogo.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const payload = {
      idexternopatriarca: values.idexternopatriarca.trim(),
      strsiglapatriarca: values.strsiglapatriarca.trim(),
      strnome: values.strnome.trim(),
    };
    try {
      let saved: Patriarca;
      if (record) saved = await updatePatriarca(record.idpatriarca, payload);
      else {
        saved = await createPatriarca({
          ...payload,
          idstatusprogresso_id: novoStatus!.idstatusprogresso,
        });
      }
      if (!record || selected?.idpatriarca === saved.idpatriarca) {
        select(saved);
      }
      await mutate((key) => Array.isArray(key) && key[0] === "carga-org-lot:patriarcas");
      router.push("/carga-org-lot/patriarcas");
      router.refresh();
    } catch (caught) {
      setError(getApiErrorMessage(caught, "Não foi possível salvar o patriarca."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminPanel className="max-w-3xl">
      <form onSubmit={submit} noValidate>
        <div className="grid gap-5 p-6 sm:grid-cols-2">
          {error && <div className="sm:col-span-2"><AdminAlert>{error}</AdminAlert></div>}
          {statusError && <div className="sm:col-span-2"><AdminAlert>Não foi possível identificar o status inicial do patriarca.</AdminAlert></div>}
          {!record && statuses && !novoStatus && <div className="sm:col-span-2"><AdminAlert>O status &quot;Novo&quot; não foi encontrado no catálogo do backend.</AdminAlert></div>}
          <Field label="Identificador externo" id="idexternopatriarca" value={values.idexternopatriarca}
            onChange={(value) => setValues((v) => ({ ...v, idexternopatriarca: value }))} />
          <Field label="Sigla" id="strsiglapatriarca" value={values.strsiglapatriarca} maxLength={30}
            onChange={(value) => setValues((v) => ({ ...v, strsiglapatriarca: value }))} />
          <Field label="Nome" id="strnome" value={values.strnome} className="sm:col-span-2"
            onChange={(value) => setValues((v) => ({ ...v, strnome: value }))} />
          <div className="space-y-2">
            <Label htmlFor="status-patriarca">Status</Label>
            <Input
              id="status-patriarca"
              value={record?.status?.strdescricao ?? novoStatus?.strdescricao ?? "Carregando..."}
              readOnly
              disabled
            />
            <p className="text-xs text-slate-500">
              {record
                ? "O status é atualizado automaticamente pelo backend."
                : 'Todo novo patriarca é criado com o status "Novo".'}
            </p>
          </div>
        </div>
        <footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button variant="outline" asChild><Link href="/carga-org-lot/patriarcas">Cancelar</Link></Button>
          <Button type="submit" disabled={isSubmitting || (!record && !novoStatus)}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </footer>
      </form>
    </AdminPanel>
  );
}

function Field({ label, id, value, onChange, maxLength, className }: {
  label: string; id: string; value: string; onChange: (value: string) => void;
  maxLength?: number; className?: string;
}) {
  return <div className={`space-y-2 ${className ?? ""}`}><Label htmlFor={id}>{label}</Label>
    <Input id={id} value={value} required maxLength={maxLength} onChange={(e) => onChange(e.target.value)} />
  </div>;
}
