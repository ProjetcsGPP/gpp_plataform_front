import api from "@/lib/api";
import { buildOrderingParam } from "@/lib/adminList";
import type { AdminListQuery } from "@/types/admin";
import type {
  AdminPaginatedResponse,
  AdminResourceApi,
} from "@/types/adminResource";

interface AdminResourceApiOptions<SortKey extends string> {
  endpoint: string;
  orderingFields: Readonly<Record<SortKey, string>>;
}

export function createAdminResourceApi<
  Row,
  Payload,
  SortKey extends string,
>({
  endpoint,
  orderingFields,
}: AdminResourceApiOptions<SortKey>): AdminResourceApi<
  Row,
  Payload,
  SortKey
> {
  return {
    async list({ page, pageSize, sorting }: AdminListQuery<SortKey>) {
      const ordering = buildOrderingParam(sorting, orderingFields);
      const response = await api.get<AdminPaginatedResponse<Row>>(endpoint, {
        params: { page, page_size: pageSize, ordering },
      });
      return response.data;
    },

    async detail(id: number) {
      const response = await api.get<Row>(`${endpoint}${id}/`);
      return response.data;
    },

    async create(payload: Payload) {
      const response = await api.post<Row>(endpoint, payload);
      return response.data;
    },

    async update(id: number, payload: Payload) {
      const response = await api.patch<Row>(`${endpoint}${id}/`, payload);
      return response.data;
    },
  };
}

export function adminListCachePrefix(resourceKey: string): string {
  return `${resourceKey}:list`;
}

export function adminDetailCacheKey(resourceKey: string, id: number) {
  return [`${resourceKey}:detail`, id] as const;
}

export function formatAdminDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
