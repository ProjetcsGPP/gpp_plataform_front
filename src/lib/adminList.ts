import type { AdminSortRule } from "@/types/admin";

export function toggleAdminSorting<SortKey extends string>(
  sorting: AdminSortRule<SortKey>[],
  key: SortKey,
  additive = false,
): AdminSortRule<SortKey>[] {
  const existing = sorting.find((rule) => rule.key === key);
  const nextRule: AdminSortRule<SortKey> = {
    key,
    direction: existing?.direction === "asc" ? "desc" : "asc",
  };

  if (!additive) return [nextRule];
  if (!existing) return [...sorting, nextRule];

  return sorting.map((rule) => (rule.key === key ? nextRule : rule));
}

export function buildOrderingParam<SortKey extends string>(
  sorting: AdminSortRule<SortKey>[],
  fieldMap: Readonly<Record<SortKey, string>>,
): string {
  return sorting.map(({ key, direction }) => {
    const field = fieldMap[key];
    return direction === "desc" ? `-${field}` : field;
  }).join(",");
}
