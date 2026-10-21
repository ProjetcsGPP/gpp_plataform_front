"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { AdminAlert } from "@/components/admin/AdminPage";
import { Button } from "@/components/ui/button";
import type {
  ItemOrganograma,
  ItemOrganogramaCreatePayload,
  ItemOrganogramaUpdatePayload,
} from "@/features/carga-org-lot/model";
import {
  compareOrganogramaItems,
  findOrganogramaRoot,
  nextOrganogramaNumber,
} from "@/features/carga-org-lot/organogramaTree";
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/apiErrors";

type OrganogramaItemType = "raiz" | "orgao" | "unidade";
type EditableField = "strsigla" | "strnome";

const ITEM_LIMITS = {
  orgao: { strnome: 100, strsigla: 20 },
  unidade: { strnome: 100, strsigla: 25 },
} as const;

export function ItemOrganogramaFormDialog({
  importacaoId,
  item,
  initialParentId,
  items,
  backendFieldErrors,
  onSave,
  onCancel,
}: {
  importacaoId: number;
  item?: ItemOrganograma;
  initialParentId?: number | null;
  items: ItemOrganograma[];
  backendFieldErrors?: Partial<Record<EditableField, string>>;
  onSave: (
    payload: ItemOrganogramaCreatePayload | ItemOrganogramaUpdatePayload,
  ) => Promise<boolean | void>;
  onCancel: () => void;
}) {
  const organogramaRoot = findOrganogramaRoot(items);
  const selectedParentId = item
    ? item.idpai_id
    : initialParentId !== undefined
      ? initialParentId
      : organogramaRoot?.iditemorganograma ?? null;
  const [values, setValues] = useState<ItemOrganogramaCreatePayload>({
    idimportacaoplanilha_id: importacaoId,
    idpai_id: selectedParentId,
    strnome: normalizeUppercase(item?.strnome ?? ""),
    strsigla: normalizeAcronym(item?.strsigla ?? ""),
    strnumero: item?.strnumero ?? nextOrganogramaNumber(items, selectedParentId),
    strresponsavel: item?.strresponsavel ?? "",
    strcargo: item?.strcargo ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<EditableField, string>>
  >({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!backendFieldErrors) return;
    setFieldErrors(backendFieldErrors);
    setIsSaving(false);
  }, [backendFieldErrors]);
  const parentOptions = useMemo(
    () => [...items]
      .filter((candidate) => candidate.iditemorganograma !== item?.iditemorganograma)
      .sort(compareOrganogramaItems),
    [item?.iditemorganograma, items],
  );
  const itemType = getItemType(values.idpai_id, items);
  const limits = itemType === "raiz" ? null : ITEM_LIMITS[itemType];
  const siglaTooLong = Boolean(
    limits && values.strsigla.length > limits.strsigla,
  );
  const nomeTooLong = Boolean(
    limits && values.strnome.length > limits.strnome,
  );
  const siglaError = siglaTooLong
    ? `A sigla do ${itemType === "orgao" ? "órgão" : "unidade"} pode ter no máximo ${limits?.strsigla} caracteres.`
    : fieldErrors.strsigla;
  const nomeError = nomeTooLong
    ? `O nome do ${itemType === "orgao" ? "órgão" : "unidade"} pode ter no máximo ${limits?.strnome} caracteres.`
    : fieldErrors.strnome;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    if (siglaTooLong || nomeTooLong) {
      setFieldErrors({
        ...(siglaTooLong ? { strsigla: siglaError } : {}),
        ...(nomeTooLong ? { strnome: nomeError } : {}),
      });
      return;
    }
    const payload = {
      idpai_id: values.idpai_id,
      strnumero: values.strnumero,
      strsigla: normalizeAcronym(values.strsigla),
      strnome: normalizeUppercase(values.strnome).trim(),
      strresponsavel: values.strresponsavel.trim(),
      strcargo: values.strcargo.trim(),
    };
    setIsSaving(true);
    try {
      const completed = await onSave(item
        ? payload
        : { ...payload, idimportacaoplanilha_id: importacaoId });
      if (completed === false) setIsSaving(false);
    } catch (caught) {
      const backendFieldErrors = getApiFieldErrors(caught);
      const nextFieldErrors = {
        strsigla: backendFieldErrors.strsigla?.join(" "),
        strnome: backendFieldErrors.strnome?.join(" "),
      };
      const hasFieldError = Boolean(
        nextFieldErrors.strsigla || nextFieldErrors.strnome,
      );
      setFieldErrors(nextFieldErrors);
      setError(
        hasFieldError
          ? null
          : getApiErrorMessage(caught, "Não foi possível salvar o item."),
      );
      setIsSaving(false);
    }
  }

  function selectParent(value: string) {
    const parentId = value ? Number(value) : null;
    setValues((current) => ({
      ...current,
      idpai_id: parentId,
      strnumero: item && parentId === item.idpai_id
        ? item.strnumero
        : nextOrganogramaNumber(items, parentId),
    }));
    setFieldErrors({});
    setError(null);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="item-form-title">
      <form onSubmit={submit} className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-xl bg-white shadow-2xl">
        <header className="border-b border-slate-200 px-6 py-4">
          <h2 id="item-form-title" className="text-lg font-bold text-slate-900">{item ? "Editar item do organograma" : "Adicionar item ao organograma"}</h2>
        </header>
        <div className="grid gap-4 p-6 sm:grid-cols-2">
          {error && <div className="sm:col-span-2"><AdminAlert>{error}</AdminAlert></div>}
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-slate-700 sm:col-span-2">
            Tipo do item: <strong>{formatItemType(itemType)}</strong>
            {itemType !== "raiz" && (
              <span className="ml-1 text-slate-600">
                — nome até 100 e sigla até {limits?.strsigla} caracteres.
              </span>
            )}
          </div>
          <Field label="Item pai">
            <select value={values.idpai_id ?? ""} onChange={(event) => selectParent(event.target.value)} className={inputClass} disabled={item?.idpai_id === null}>
              {item?.idpai_id === null && <option value="">Sem unidade pai</option>}
              {!item && !organogramaRoot && <option value="">Nenhuma unidade pai disponível</option>}
              {parentOptions.map((candidate) => (
                <option key={candidate.iditemorganograma} value={candidate.iditemorganograma}>{formatParentOption(candidate)}</option>
              ))}
            </select>
          </Field>
          <Field label="Número do item"><input required value={values.strnumero} onChange={(event) => setValues({ ...values, strnumero: event.target.value })} className={inputClass} disabled={Boolean(item)} /></Field>
          <Field
            label="Sigla"
            htmlFor="item-organograma-sigla"
            counter={limits ? `${values.strsigla.length}/${limits.strsigla}` : undefined}
            error={siglaError}
          >
            <UppercaseInput
              id="item-organograma-sigla"
              required
              value={values.strsigla}
              maxLength={limits?.strsigla}
              aria-invalid={Boolean(siglaError)}
              normalizeValue={normalizeAcronym}
              onValueChange={(strsigla) => {
                setValues((current) => ({ ...current, strsigla }));
                setFieldErrors((current) => ({
                  ...current,
                  strsigla: undefined,
                }));
              }}
              className={inputClass}
            />
            <span className="mt-1 block text-xs text-slate-500">
              Use letras maiúsculas e números, sem espaços.
            </span>
          </Field>
          <Field
            label="Nome"
            htmlFor="item-organograma-nome"
            counter={limits ? `${values.strnome.length}/${limits.strnome}` : undefined}
            error={nomeError}
          >
            <UppercaseInput
              id="item-organograma-nome"
              required
              value={values.strnome}
              maxLength={limits?.strnome}
              aria-invalid={Boolean(nomeError)}
              onValueChange={(strnome) => {
                setValues((current) => ({ ...current, strnome }));
                setFieldErrors((current) => ({
                  ...current,
                  strnome: undefined,
                }));
              }}
              className={inputClass}
            />
          </Field>
          <Field label="Responsável">
            <input
              value={values.strresponsavel}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  strresponsavel: event.target.value,
                }))
              }
              className={inputClass}
            />
          </Field>
          <Field label="Cargo/Função">
            <input
              value={values.strcargo}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  strcargo: event.target.value,
                }))
              }
              className={inputClass}
            />
          </Field>
        </div>
        <footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>Cancelar</Button>
          <Button type="submit" disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar"}</Button>
        </footer>
      </form>
    </div>
  );
}

const inputClass = "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

function Field({
  label,
  htmlFor,
  counter,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  counter?: string;
  error?: string;
  children: React.ReactNode;
}) {
  const content = (
    <>
      <span className="flex items-center justify-between gap-2">
        {htmlFor ? <label htmlFor={htmlFor}>{label}</label> : <span>{label}</span>}
        {counter && (
          <span className={error ? "font-semibold text-red-700" : "text-slate-500"}>
            {counter}
          </span>
        )}
      </span>
      {children}
      {error && (
        <span role="alert" className="mt-1 block text-xs font-medium text-red-700">
          {error}
        </span>
      )}
    </>
  );
  return htmlFor
    ? <div className="text-sm text-slate-700">{content}</div>
    : <label className="text-sm text-slate-700">{content}</label>;
}

function formatParentOption(item: ItemOrganograma) {
  return item.strnumero.trim()
    ? `${item.strnumero} - ${item.strsigla}`
    : item.strsigla;
}

function normalizeUppercase(value: string) {
  return value.toLocaleUpperCase("pt-BR");
}

function normalizeAcronym(value: string) {
  return normalizeUppercase(value).replace(/\s/g, "");
}

function getItemType(
  parentId: number | null,
  items: ItemOrganograma[],
): OrganogramaItemType {
  if (parentId === null) return "raiz";
  const parent = items.find(
    (candidate) => candidate.iditemorganograma === parentId,
  );
  return parent?.idpai_id === null ? "orgao" : "unidade";
}

function formatItemType(type: OrganogramaItemType) {
  if (type === "raiz") return "Raiz / Patriarca";
  return type === "orgao" ? "Órgão" : "Unidade";
}

function UppercaseInput({
  value,
  onValueChange,
  normalizeValue = normalizeUppercase,
  ...props
}: Omit<React.ComponentProps<"input">, "onChange" | "value"> & {
  value: string;
  onValueChange: (value: string) => void;
  normalizeValue?: (value: string) => string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const selectionRef = useRef<{ start: number; end: number } | null>(null);

  useLayoutEffect(() => {
    const selection = selectionRef.current;
    if (!selection || !inputRef.current) return;
    inputRef.current.setSelectionRange(selection.start, selection.end);
    selectionRef.current = null;
  }, [value]);

  return (
    <input
      {...props}
      ref={inputRef}
      value={value}
      onChange={(event) => {
        const rawValue = event.currentTarget.value;
        const start = event.currentTarget.selectionStart ?? rawValue.length;
        const end = event.currentTarget.selectionEnd ?? start;
        selectionRef.current = {
          start: normalizeValue(rawValue.slice(0, start)).length,
          end: normalizeValue(rawValue.slice(0, end)).length,
        };
        onValueChange(normalizeValue(rawValue));
      }}
    />
  );
}
