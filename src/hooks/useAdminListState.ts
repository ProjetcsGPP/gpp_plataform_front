"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { toggleAdminSorting } from "@/lib/adminList";
import type {
  AdminListPreferences,
  AdminListQuery,
  AdminSortRule,
  AdminTableDensity,
} from "@/types/admin";

interface AdminListStateOptions<SortKey extends string> {
  sortKeys: readonly SortKey[];
  defaults: AdminListPreferences<SortKey>;
  pageSizeOptions?: readonly number[];
}

function positiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseSorting<SortKey extends string>(
  value: string | null,
  sortKeys: readonly SortKey[],
  fallback: AdminSortRule<SortKey>[],
): AdminSortRule<SortKey>[] {
  if (!value) return fallback;

  const allowed = new Set<string>(sortKeys);
  const rules = value
    .split(",")
    .map((token) => ({
      key: token.replace(/^-/, ""),
      direction: token.startsWith("-") ? "desc" : "asc",
    }))
    .filter(
      (rule): rule is AdminSortRule<SortKey> =>
        allowed.has(rule.key) &&
        (rule.direction === "asc" || rule.direction === "desc"),
    );

  return rules.length > 0 ? rules : fallback;
}

function serializeSorting<SortKey extends string>(
  sorting: AdminSortRule<SortKey>[],
): string {
  return sorting
    .map(({ key, direction }) => (direction === "desc" ? `-${key}` : key))
    .join(",");
}

export function useAdminListState<SortKey extends string>({
  sortKeys,
  defaults,
  pageSizeOptions = [10, 20, 50],
}: AdminListStateOptions<SortKey>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const requestedPageSize = positiveInteger(
    searchParams.get("page_size"),
    defaults.pageSize,
  );
  const pageSize = pageSizeOptions.includes(requestedPageSize)
    ? requestedPageSize
    : defaults.pageSize;
  const density: AdminTableDensity =
    searchParams.get("density") === "comfortable"
      ? "comfortable"
      : searchParams.get("density") === "compact"
        ? "compact"
        : defaults.density;
  const sorting = parseSorting(
    searchParams.get("sort"),
    sortKeys,
    defaults.sorting,
  );
  const query: AdminListQuery<SortKey> = {
    page: positiveInteger(searchParams.get("page"), 1),
    pageSize,
    sorting,
  };

  function replaceParams(update: Record<string, string | number>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(update)) {
      next.set(key, String(value));
    }
    const queryString = next.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }

  function setPage(page: number) {
    replaceParams({ page: Math.max(1, page) });
  }

  function setPageSize(nextPageSize: number) {
    if (!pageSizeOptions.includes(nextPageSize)) return;
    replaceParams({ page: 1, page_size: nextPageSize });
  }

  function setDensity(nextDensity: AdminTableDensity) {
    replaceParams({ density: nextDensity });
  }

  function toggleSorting(key: SortKey, additive = false) {
    const next = toggleAdminSorting(sorting, key, additive);
    replaceParams({ page: 1, sort: serializeSorting(next) });
  }

  function resetView() {
    replaceParams({
      page: 1,
      page_size: defaults.pageSize,
      density: defaults.density,
      sort: serializeSorting(defaults.sorting),
    });
  }

  return {
    query,
    density,
    pageSizeOptions,
    setPage,
    setPageSize,
    setDensity,
    toggleSorting,
    resetView,
  };
}
