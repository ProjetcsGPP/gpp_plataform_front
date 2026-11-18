import type { ScopedMutator } from "swr";

const MONTHLY_PREFIX = "pub-institucional:edocs";

export const edocsMensalCacheKeys = {
  coletas: (values: readonly unknown[]) =>
    [MONTHLY_PREFIX, "mensal-coletas", ...values] as const,
  patriarcas: (values: readonly unknown[]) =>
    [MONTHLY_PREFIX, "mensal-patriarcas", ...values] as const,
  totaisPatriarcas: (coletaId: string) =>
    [MONTHLY_PREFIX, "mensal-patriarcas-totais", coletaId] as const,
  totaisHistoricos: (values: readonly unknown[]) =>
    [MONTHLY_PREFIX, "mensal-patriarcas-totais-historicos", ...values] as const,
  organizacoes: (values: readonly unknown[]) =>
    [MONTHLY_PREFIX, "mensal-organizacoes", ...values] as const,
  fontes: (values: readonly unknown[]) =>
    [MONTHLY_PREFIX, "mensal-fontes", ...values] as const,
  auditoria: (values: readonly unknown[]) =>
    [MONTHLY_PREFIX, "mensal-auditoria", ...values] as const,
};

export async function revalidateColetaMensalEdocsCaches(
  mutate: ScopedMutator,
  coletaId?: string,
) {
  await mutate(
    (cacheKey) => {
      if (!Array.isArray(cacheKey) || cacheKey[0] !== MONTHLY_PREFIX) return false;
      if (cacheKey[1] === "mensal-coletas") return true;
      return Boolean(coletaId) && cacheKey.includes(coletaId);
    },
    undefined,
    { revalidate: true },
  );
}
