import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import type { AdminSortRule } from "@/types/admin";

interface AdminSortableHeaderProps<Field extends string> {
  field: Field;
  label: string;
  sorting: AdminSortRule<Field>[];
  onSort: (field: Field, additive: boolean) => void;
  className?: string;
}

export function AdminSortableHeader<Field extends string>({
  field,
  label,
  sorting,
  onSort,
  className,
}: AdminSortableHeaderProps<Field>) {
  const sortIndex = sorting.findIndex((rule) => rule.key === field);
  const activeRule = sortIndex >= 0 ? sorting[sortIndex] : undefined;
  const active = Boolean(activeRule);
  const ariaSort = active
    ? activeRule?.direction === "asc"
      ? "ascending"
      : "descending"
    : "none";
  const Icon = active
    ? activeRule?.direction === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={cn("px-5 py-2.5 font-semibold", className)}
    >
      <button
        type="button"
        onClick={(event) => onSort(field, event.shiftKey)}
        title="Clique para ordenar. Use Shift+clique para combinar campos."
        className={cn(
          "group inline-flex items-center gap-1.5 rounded-sm text-left",
          "hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-primary",
        )}
      >
        {label}
        <Icon
          className={cn(
            "size-3.5",
            active ? "text-app-primary" : "text-slate-400 group-hover:text-slate-600",
          )}
          aria-hidden="true"
        />
        {active && sorting.length > 1 && (
          <span
            className="inline-flex size-4 items-center justify-center rounded-full bg-app-accent-light text-[10px] font-bold text-app-primary"
            title={`Prioridade de ordenação ${sortIndex + 1}`}
          >
            {sortIndex + 1}
            <span className="sr-only">º critério</span>
          </span>
        )}
      </button>
    </th>
  );
}
