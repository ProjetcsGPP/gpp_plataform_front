import { describe, expect, it, vi } from "vitest";

import { EDOCS_ACTIONS, hasEdocsAction } from "@/features/publicacoes/edocs/actions";
import {
  EDOCS_CACHE_PREFIX,
  isEdocsCacheKey,
  revalidateEdocsCaches,
} from "@/features/publicacoes/edocs/cache";

describe("autoridade funcional E-Docs", () => {
  it("reconhece somente ações explicitamente devolvidas pelo backend", () => {
    expect(
      hasEdocsAction(
        ["alterar_selecao_coleta"],
        EDOCS_ACTIONS.ALTERAR_SELECAO_COLETA,
      ),
    ).toBe(true);
    expect(hasEdocsAction([], EDOCS_ACTIONS.ALTERAR_SELECAO_COLETA)).toBe(false);
    expect(hasEdocsAction(["outra_acao"], EDOCS_ACTIONS.DECIDIR)).toBe(false);
  });

  it("revalida todo o namespace SWR após mutações ou sinais", async () => {
    const mutate = vi.fn().mockResolvedValue(undefined);

    await revalidateEdocsCaches(mutate);

    expect(mutate).toHaveBeenCalledWith(isEdocsCacheKey, undefined, {
      revalidate: true,
    });
    expect(isEdocsCacheKey([EDOCS_CACHE_PREFIX, "coletas", 1])).toBe(true);
    expect(isEdocsCacheKey(["outro-contexto", "coletas"])).toBe(false);
  });
});
