"use client";

import useSWR from "swr";

import {
  adminDetailCacheKey,
  adminListCachePrefix,
} from "@/lib/adminResource";
import type { AdminListQuery } from "@/types/admin";
import type {
  AdminAuditRecord,
  AdminResourceDefinition,
} from "@/types/adminResource";

export function useAdminResourceList<
  Row extends AdminAuditRecord,
  Payload,
  FormValues extends object,
  SortKey extends string,
>(
  resource: AdminResourceDefinition<Row, Payload, FormValues, SortKey>,
  query: AdminListQuery<SortKey>,
) {
  const orderingKey = query.sorting
    .map(({ key, direction }) => `${key}:${direction}`)
    .join(",");

  return useSWR(
    [
      adminListCachePrefix(resource.key),
      query.page,
      query.pageSize,
      orderingKey,
    ] as const,
    () => resource.api.list(query),
    { keepPreviousData: true, revalidateOnFocus: false },
  );
}

export function useAdminResourceDetail<
  Row extends AdminAuditRecord,
  Payload,
  FormValues extends object,
  SortKey extends string,
>(
  resource: AdminResourceDefinition<Row, Payload, FormValues, SortKey>,
  id: number | null,
) {
  return useSWR(
    id === null ? null : adminDetailCacheKey(resource.key, id),
    ([, resourceId]) => resource.api.detail(resourceId),
    { revalidateOnMount: true, revalidateOnFocus: false },
  );
}
