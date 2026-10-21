import type { ReactNode } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

interface AdminPageProps {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AdminPage({
  title,
  description,
  actions,
  children,
}: AdminPageProps) {
  return (
    <div className="w-full py-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-app-primary">
            Configurações
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
    </div>
  );
}

export function AdminPanel({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

export function AdminAlert({
  children,
  variant = "error",
  onClose,
}: {
  children: ReactNode;
  variant?: "error" | "success";
  onClose?: () => void;
}) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "relative rounded-lg border px-4 py-3 text-sm",
        onClose && "pr-11",
        variant === "error"
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800",
      )}
    >
      {children}
      {onClose && (
        <button
          type="button"
          aria-label="Fechar mensagem"
          className="absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
          onClick={onClose}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
