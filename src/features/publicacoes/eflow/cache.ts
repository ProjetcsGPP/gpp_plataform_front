import type { ScopedMutator } from "swr";

export const EFLOW_CACHE_PREFIX = "pub-institucional:eflow";

export const eflowCacheKeys = {
  coletas: (values: readonly unknown[]) =>
    [EFLOW_CACHE_PREFIX, "coletas", ...values] as const,
  definicoes: (values: readonly unknown[]) =>
    [EFLOW_CACHE_PREFIX, "definicoes", ...values] as const,
  auditoria: (values: readonly unknown[]) =>
    [EFLOW_CACHE_PREFIX, "auditoria", ...values] as const,
  resultados: (values: readonly unknown[]) =>
    [EFLOW_CACHE_PREFIX, "resultados", ...values] as const,
  preferencia: () => [EFLOW_CACHE_PREFIX, "preferencia"] as const,
  auditoriaPreferencia: (values: readonly unknown[]) =>
    [EFLOW_CACHE_PREFIX, "auditoria-preferencia", ...values] as const,
};

export function isEflowCacheKey(key: unknown): boolean {
  return Array.isArray(key) && key[0] === EFLOW_CACHE_PREFIX;
}

export async function revalidateEflowCaches(mutate: ScopedMutator) {
  await mutate(isEflowCacheKey, undefined, { revalidate: true });
}
