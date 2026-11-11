import type { ScopedMutator } from "swr";
export const PUBLICACOES_CACHE_PREFIX = "pub-institucional:publicacoes";
export const publicacoesCacheKeys = {
  list: (values: readonly unknown[]) => [PUBLICACOES_CACHE_PREFIX, "list", ...values] as const,
  detail: (id: string) => [PUBLICACOES_CACHE_PREFIX, "detail", id] as const,
  preview: (id: string) => [PUBLICACOES_CACHE_PREFIX, "preview", id] as const,
  views: (values: readonly unknown[] = []) => [PUBLICACOES_CACHE_PREFIX, "views", ...values] as const,
  history: (id: string) => [PUBLICACOES_CACHE_PREFIX, "history", id] as const,
};
export const isPublicacoesCacheKey = (key: unknown) => Array.isArray(key) && key[0] === PUBLICACOES_CACHE_PREFIX;
export const revalidatePublicacoesCaches = (mutate: ScopedMutator) => mutate(isPublicacoesCacheKey, undefined, { revalidate: true });
