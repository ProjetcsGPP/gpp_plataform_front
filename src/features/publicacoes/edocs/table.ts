import type { AdminSortRule } from "@/types/admin";

export function edocsOrdering<SortKey extends string>(
  sorting: AdminSortRule<SortKey>[],
) {
  return sorting
    .map(({ key, direction }) => `${direction === "desc" ? "-" : ""}${key}`)
    .join(",");
}

export function nextEdocsSorting<SortKey extends string>(
  current: AdminSortRule<SortKey>[],
  key: SortKey,
  additive: boolean,
) {
  const found = current.find((rule) => rule.key === key);
  const next = found?.direction === "asc" ? "desc" : "asc";
  if (!additive) return [{ key, direction: next }] satisfies AdminSortRule<SortKey>[];
  return [
    ...current.filter((rule) => rule.key !== key),
    { key, direction: next },
  ] satisfies AdminSortRule<SortKey>[];
}
