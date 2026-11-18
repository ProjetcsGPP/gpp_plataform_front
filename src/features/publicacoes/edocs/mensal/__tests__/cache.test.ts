import { describe, expect, it, vi } from "vitest";

import { revalidateEdocsCaches } from "@/features/publicacoes/edocs/cache";
import {
  edocsMensalCacheKeys,
  revalidateColetaMensalEdocsCaches,
} from "@/features/publicacoes/edocs/mensal/cache";

describe("revalidação mensal por sinal E-Docs", () => {
  it("inclui listagem e resultados mensais no predicado global do WebSocket", async () => {
    const mutate = vi.fn().mockResolvedValue(undefined);

    await revalidateEdocsCaches(mutate);

    const predicate = mutate.mock.calls[0][0] as (key: unknown) => boolean;
    expect(predicate(edocsMensalCacheKeys.coletas([1]))).toBe(true);
    expect(predicate(edocsMensalCacheKeys.patriarcas(["coleta-1"]))).toBe(true);
    expect(predicate(edocsMensalCacheKeys.totaisPatriarcas("coleta-1"))).toBe(true);
    expect(predicate(edocsMensalCacheKeys.totaisHistoricos([2024, 25]))).toBe(true);
    expect(predicate(edocsMensalCacheKeys.organizacoes(["coleta-1"]))).toBe(true);
    expect(predicate(edocsMensalCacheKeys.fontes(["coleta-1"]))).toBe(true);
    expect(predicate(edocsMensalCacheKeys.auditoria(["coleta-1"]))).toBe(true);
  });

  it("revalida lista, detalhe e auditoria da coleta reencaminhada", async () => {
    const mutate = vi.fn().mockResolvedValue(undefined);

    await revalidateColetaMensalEdocsCaches(mutate, "coleta-1");

    const predicate = mutate.mock.calls[0][0] as (key: unknown) => boolean;
    expect(predicate(edocsMensalCacheKeys.coletas([1]))).toBe(true);
    expect(predicate(edocsMensalCacheKeys.auditoria(["coleta-1"]))).toBe(true);
    expect(predicate(edocsMensalCacheKeys.patriarcas(["coleta-1"]))).toBe(true);
    expect(predicate(edocsMensalCacheKeys.totaisPatriarcas("coleta-1"))).toBe(true);
    expect(predicate(edocsMensalCacheKeys.auditoria(["coleta-2"]))).toBe(false);
  });
});
