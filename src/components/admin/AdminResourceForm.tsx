"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";

import { AdminAuditDetails } from "@/components/admin/AdminAuditDetails";
import { AdminFormPanel } from "@/components/admin/AdminFormPanel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminDetailCacheKey,
  adminListCachePrefix,
} from "@/lib/adminResource";
import { getApiErrorMessage } from "@/lib/apiErrors";
import type {
  AdminAuditRecord,
  AdminResourceDefinition,
} from "@/types/adminResource";

interface AdminResourceFormProps<
  Row extends AdminAuditRecord,
  Payload,
  FormValues extends object,
  SortKey extends string,
> {
  resource: AdminResourceDefinition<Row, Payload, FormValues, SortKey>;
  record?: Row;
}

export function AdminResourceForm<
  Row extends AdminAuditRecord,
  Payload,
  FormValues extends object,
  SortKey extends string,
>({ resource, record }: AdminResourceFormProps<Row, Payload, FormValues, SortKey>) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const [values, setValues] = useState<FormValues>(() =>
    resource.getInitialValues(record),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField(name: Extract<keyof FormValues, string>, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationError = resource.validate(values);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = resource.toPayload(values);
      const saved = record
        ? await resource.api.update(resource.getId(record), payload)
        : await resource.api.create(payload);
      const id = resource.getId(saved);

      await mutate(adminDetailCacheKey(resource.key, id), saved, {
        revalidate: false,
      });
      await mutate(
        (key) =>
          Array.isArray(key) &&
          key[0] === adminListCachePrefix(resource.key),
        undefined,
        { revalidate: false },
      );
      router.push(resource.basePath);
      router.refresh();
    } catch (submitError) {
      setError(
        getApiErrorMessage(
          submitError,
          record ? resource.texts.editError : resource.texts.createError,
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminFormPanel
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      error={error}
      cancelHref={resource.basePath}
    >
      {resource.renderFields
        ? resource.renderFields({ values, setField })
        : resource.fields.map((field) => (
            <div key={field.name} className={field.className ?? "space-y-2"}>
              <Label htmlFor={field.name}>{field.label}</Label>
              <Input
                id={field.name}
                name={field.name}
                type={field.type ?? "text"}
                value={String(values[field.name] ?? "")}
                onChange={(event) => setField(field.name, event.target.value)}
                maxLength={field.maxLength}
                required={field.required}
                autoFocus={field.autoFocus}
                aria-describedby={
                  field.help ? `${field.name}-help` : undefined
                }
              />
              {field.help && (
                <p id={`${field.name}-help`} className="text-xs text-slate-500">
                  {field.help}
                </p>
              )}
            </div>
          ))}

      {record && (
        <AdminAuditDetails
          identifier={resource.getId(record)}
          createdBy={record.created_by_name ?? ""}
          createdAt={record.created_at}
          updatedBy={record.updated_by_name ?? ""}
          updatedAt={record.updated_at}
        />
      )}
    </AdminFormPanel>
  );
}
