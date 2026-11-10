"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function EdocsPage({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="w-full py-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-app-primary">
            Publicações Institucionais
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            {description}
          </p>
        </div>
        {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
      </header>
      {children}
    </section>
  );
}

export function EdocsFilters({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      {children}
    </div>
  );
}

export function EdocsTextFilter({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="min-w-56 flex-1 text-xs font-medium text-slate-600">
      {label}
      <Input
        className="mt-1 bg-white"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export function EdocsSelectFilter({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="text-xs font-medium text-slate-600">
      {label}
      <select
        className="mt-1 block min-w-48 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </label>
  );
}

export function EdocsStatusBadge({
  children,
  positive = false,
  negative = false,
}: {
  children: ReactNode;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <Badge
      variant={negative ? "destructive" : positive ? "secondary" : "outline"}
    >
      {children}
    </Badge>
  );
}

export function EdocsModal({
  title,
  onClose,
  children,
  wide = false,
  extraWide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  extraWide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edocs-dialog-title"
    >
      <section
        className={`max-h-[90vh] w-full overflow-auto rounded-xl bg-white p-6 shadow-2xl ${
          extraWide ? "max-w-7xl" : wide ? "max-w-4xl" : "max-w-xl"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="edocs-dialog-title" className="text-lg font-bold text-slate-900">
            {title}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar">
            <X aria-hidden="true" />
          </Button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function EdocsJsonBlock({
  title,
  value,
}: {
  title: string;
  value: Record<string, unknown> | null;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
        {title}
      </h3>
      <pre className="mt-1 max-h-64 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
        {value ? JSON.stringify(value, null, 2) : "Sem dados"}
      </pre>
    </div>
  );
}
