import type { ReactNode } from "react";

import type { PermissionKey } from "@/lib/permissions";
import type { AdminListPreferences, AdminListQuery } from "@/types/admin";

export interface AdminAuditRecord {
  created_by_name: string | null;
  updated_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminPaginatedResponse<Row> {
  count: number;
  next: string | null;
  previous: string | null;
  results: Row[];
}

export interface AdminResourceApi<Row, Payload, SortKey extends string> {
  list: (
    query: AdminListQuery<SortKey>,
  ) => Promise<AdminPaginatedResponse<Row>>;
  detail: (id: number) => Promise<Row>;
  create: (payload: Payload) => Promise<Row>;
  update: (id: number, payload: Payload) => Promise<Row>;
}

export interface AdminResourceColumn<Row, SortKey extends string> {
  key: string;
  label: string;
  sortKey?: SortKey;
  render: (row: Row) => ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface AdminResourceField<FormValues extends object> {
  name: Extract<keyof FormValues, string>;
  label: string;
  help?: string;
  type?: "text";
  required?: boolean;
  maxLength?: number;
  autoFocus?: boolean;
  className?: string;
}

export interface AdminResourceFormContext<FormValues extends object> {
  values: FormValues;
  setField: (
    name: Extract<keyof FormValues, string>,
    value: string,
  ) => void;
}

export interface AdminResourceTexts<Row> {
  listTitle: string;
  listDescription: string;
  createAction: string;
  empty: string;
  listError: string;
  createTitle: string;
  createDescription: string;
  createError: string;
  editTitle: string;
  editDescription: (row: Row) => string;
  editError: string;
  notFound: string;
  loading: string;
}

export interface AdminResourceDefinition<
  Row extends AdminAuditRecord,
  Payload,
  FormValues extends object,
  SortKey extends string,
> {
  /** Identificador estavel para cache e futuras preferencias por tela. */
  key: string;
  basePath: string;
  permissions: {
    view: PermissionKey;
    add: PermissionKey;
    change: PermissionKey;
  };
  api: AdminResourceApi<Row, Payload, SortKey>;
  getId: (row: Row) => number;
  sortKeys: readonly SortKey[];
  defaultPreferences: AdminListPreferences<SortKey>;
  columns: readonly AdminResourceColumn<Row, SortKey>[];
  auditColumns?: {
    updatedBy: SortKey;
    updatedAt: SortKey;
  };
  fields: readonly AdminResourceField<FormValues>[];
  /** Substitui os campos declarativos quando o formulario exigir UI propria. */
  renderFields?: (context: AdminResourceFormContext<FormValues>) => ReactNode;
  getInitialValues: (row?: Row) => FormValues;
  toPayload: (values: FormValues) => Payload;
  validate: (values: FormValues) => string | null;
  texts: AdminResourceTexts<Row>;
}
