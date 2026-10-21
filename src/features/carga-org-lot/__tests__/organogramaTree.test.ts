import { describe, expect, it } from "vitest";

import type { ItemOrganograma } from "@/features/carga-org-lot/model";
import { branchIds, buildOrganogramaTree, compareOrganogramaItems, findOrganogramaRoot, nextOrganogramaNumber } from "@/features/carga-org-lot/organogramaTree";

function item(overrides: Partial<ItemOrganograma>): ItemOrganograma {
  return {
    iditemorganograma: 1,
    idimportacaoplanilha_id: 7,
    idpai_id: null,
    pai_sigla: null,
    strnome: "Prefeitura",
    strsigla: "PMBG",
    strnumero: "1",
    strresponsavel: "",
    strcargo: "",
    flggeradoautomaticamente: false,
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

  it("usa ids para manter siglas e nomes repetidos em ramos diferentes", () => {
    const tree = buildOrganogramaTree([
      item({ iditemorganograma: 1, strsigla: "PAT", strnome: "Patriarca" }),
      item({ iditemorganograma: 2, idpai_id: 1, strnumero: "1.1", strsigla: "ORG-A" }),
      item({ iditemorganograma: 3, idpai_id: 1, strnumero: "1.2", strsigla: "ORG-B" }),
      item({ iditemorganograma: 4, idpai_id: 2, strnumero: "1.1.1", strsigla: "REP", strnome: "Repetida" }),
      item({ iditemorganograma: 5, idpai_id: 3, strnumero: "1.2.1", strsigla: "REP", strnome: "Repetida" }),
      item({ iditemorganograma: 6, idpai_id: 4, strnumero: "1.1.1.1", strsigla: "REP", strnome: "Repetida" }),
    ]);

    expect(tree[0].children[0].children[0].iditemorganograma).toBe(4);
    expect(tree[0].children[1].children[0].iditemorganograma).toBe(5);
    expect(tree[0].children[0].children[0].children[0].iditemorganograma).toBe(6);
  });

  it("ordena o número hierárquico numericamente em vez de alfabeticamente", () => {
    const items = [
      item({ iditemorganograma: 10, strnumero: "1.10" }),
      item({ iditemorganograma: 2, strnumero: "1.2" }),
      item({ iditemorganograma: 11, strnumero: "1.2.10" }),
      item({ iditemorganograma: 3, strnumero: "1.2.3" }),
    ];

    expect(items.sort(compareOrganogramaItems).map((entry) => entry.strnumero))
      .toEqual(["1.2", "1.2.3", "1.2.10", "1.10"]);
  });

  it("calcula o próximo número dos filhos diretos da unidade pai", () => {
    const items = [
      item({ iditemorganograma: 1, strnumero: "1" }),
      item({ iditemorganograma: 2, idpai_id: 1, strnumero: "1.2" }),
      item({ iditemorganograma: 3, idpai_id: 1, strnumero: "1.10" }),
      item({ iditemorganograma: 4, idpai_id: 2, strnumero: "1.2.3" }),
    ];

    expect(nextOrganogramaNumber(items, 1)).toBe("1.11");
    expect(nextOrganogramaNumber(items, 2)).toBe("1.2.4");
  });

  it("calcula o próximo número das unidades raiz", () => {
    const items = [
      item({ iditemorganograma: 1, strnumero: "1" }),
      item({ iditemorganograma: 2, strnumero: "9" }),
      item({ iditemorganograma: 3, strnumero: "10" }),
      item({ iditemorganograma: 4, idpai_id: 1, strnumero: "1.20" }),
    ];

    expect(nextOrganogramaNumber(items, null)).toBe("11");
  });

  it("usa a unidade estrutural sem número como raiz e continua seus filhos", () => {
    const items = [
      item({ iditemorganograma: 1, strnumero: "", strsigla: "PMEXE" }),
      item({ iditemorganograma: 2, idpai_id: 1, strnumero: "1" }),
      item({ iditemorganograma: 3, idpai_id: 1, strnumero: "19" }),
    ];
    const root = findOrganogramaRoot(items);

    expect(root?.strsigla).toBe("PMEXE");
    expect(nextOrganogramaNumber(items, root?.iditemorganograma ?? null)).toBe("20");
  });
});
