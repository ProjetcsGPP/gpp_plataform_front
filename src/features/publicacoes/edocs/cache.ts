import type { ScopedMutator } from "swr";

export const EDOCS_CACHE_PREFIX = "pub-institucional:edocs";

export const edocsCacheKeys = {
  patriarcas: (values: readonly unknown[]) =>
    [EDOCS_CACHE_PREFIX, "patriarcas", ...values] as const,
  coletas: (values: readonly unknown[]) =>
    [EDOCS_CACHE_PREFIX, "coletas", ...values] as const,
  divergencias: (values: readonly unknown[]) =>
    [EDOCS_CACHE_PREFIX, "divergencias", ...values] as const,
  auditoria: (values: readonly unknown[]) =>
    [EDOCS_CACHE_PREFIX, "auditoria", ...values] as const,
};

export function isEdocsCacheKey(key: unknown): boolean {
  return Array.isArray(key) && key[0] === EDOCS_CACHE_PREFIX;
}

export async function revalidateEdocsCaches(mutate: ScopedMutator) {
  await mutate(isEdocsCacheKey, undefined, { revalidate: true });
}
