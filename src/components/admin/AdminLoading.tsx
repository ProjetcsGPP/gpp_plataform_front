import { Loader2 } from "lucide-react";

export function AdminLoading({ label = "Carregando..." }: { label?: string }) {
  return (
    <div
      className="flex min-h-48 items-center justify-center gap-2 text-sm text-slate-500"
      role="status"
    >
      <Loader2 className="size-5 animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}
