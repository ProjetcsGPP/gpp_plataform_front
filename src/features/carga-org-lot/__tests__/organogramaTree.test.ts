import { describe, expect, it } from "vitest";

import type { ItemOrganograma } from "@/features/carga-org-lot/model";
import { branchIds, buildOrganogramaTree } from "@/features/carga-org-lot/organogramaTree";

function item(overrides: Partial<ItemOrganograma>): ItemOrganograma {
  return {
    iditemorganograma: 1,
    idimportacaoplanilha_id: 7,
    idpai_id: null,
    pai_sigla: null,
    strnome: "Prefeitura",
    strsigla: "PMBG",
    strnumero: "1",
    strabaorigem: "Organograma",
    intlinhaorigem: 2,
    strreferenciapai: "",
    ...overrides,
  };
}

describe("montagem da árvore de organograma", () => {
  it("usa idpai_id e não depende da ordem retornada pela API", () => {
    const tree = buildOrganogramaTree([
      item({ iditemorganograma: 3, idpai_id: 2, strnumero: "1.1.1", strsigla: "FILHO" }),
      item({ iditemorganograma: 1 }),
      item({ iditemorganograma: 2, idpai_id: 1, strnumero: "1.1", strsigla: "PAI" }),
    ]);
    expect(tree).toHaveLength(1);
    expect(tree[0].children[0].strsigla).toBe("PAI");
    expect(tree[0].children[0].children[0].strsigla).toBe("FILHO");
    expect(branchIds(tree)).toEqual([1, 2]);
  });

  it("mantém como raiz item cujo pai não veio na resposta", () => {
    const [root] = buildOrganogramaTree([
      item({ iditemorganograma: 8, idpai_id: 999, strsigla: "ORFA" }),
    ]);
    expect(root.strsigla).toBe("ORFA");
  });
});
