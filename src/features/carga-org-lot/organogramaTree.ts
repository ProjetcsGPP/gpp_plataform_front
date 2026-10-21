import type {
  ItemOrganograma,
  ItemOrganogramaNode,
} from "@/features/carga-org-lot/model";

const hierarchyCollator = new Intl.Collator("pt-BR", {
  numeric: true,
  sensitivity: "base",
});

export function compareOrganogramaItems(a: ItemOrganograma, b: ItemOrganograma) {
  return hierarchyCollator.compare(a.strnumero, b.strnumero)
    || a.intlinhaorigem - b.intlinhaorigem
    || a.iditemorganograma - b.iditemorganograma;
}

export function nextOrganogramaNumber(
  items: ItemOrganograma[],
  parentId: number | null,
) {
  const parent = parentId === null
    ? null
    : items.find((item) => item.iditemorganograma === parentId);
  const parentNumber = parent?.strnumero.trim() ?? "";
  const prefix = parentNumber ? `${parentNumber}.` : "";
  const lastSegment = items
    .filter((item) => item.idpai_id === parentId)
    .map((item) => item.strnumero.trim())
    .map((number) => prefix && number.startsWith(prefix)
      ? number.slice(prefix.length)
      : prefix ? "" : number)
    .filter((number) => /^\d+$/.test(number))
    .reduce((highest, number) => Math.max(highest, Number(number)), 0);

  return `${prefix}${lastSegment + 1}`;
}

export function findOrganogramaRoot(items: ItemOrganograma[]) {
  const roots = items
    .filter((item) => item.idpai_id === null)
    .sort(compareOrganogramaItems);
  return roots.find((item) => !item.strnumero.trim()) ?? roots[0] ?? null;
}

export function buildOrganogramaTree(
  items: ItemOrganograma[],
): ItemOrganogramaNode[] {
  const nodes = new Map<number, ItemOrganogramaNode>();
  items.forEach((item) => nodes.set(item.iditemorganograma, { ...item, children: [] }));

  const roots: ItemOrganogramaNode[] = [];
  nodes.forEach((node) => {
    const parent = node.idpai_id === null ? null : nodes.get(node.idpai_id);
    if (parent && parent.iditemorganograma !== node.iditemorganograma) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortNodes = (list: ItemOrganogramaNode[]) => {
    list.sort(compareOrganogramaItems);
    list.forEach((node) => sortNodes(node.children));
  };
  sortNodes(roots);
  return roots;
}

export function branchIds(nodes: ItemOrganogramaNode[]): number[] {
  return nodes.flatMap((node) => [
    ...(node.children.length ? [node.iditemorganograma] : []),
    ...branchIds(node.children),
  ]);
}

export function flattenOrganogramaTree(
  nodes: ItemOrganogramaNode[],
): ItemOrganogramaNode[] {
  return nodes.flatMap((node) => [node, ...flattenOrganogramaTree(node.children)]);
}

export function ancestorIds(items: ItemOrganograma[], itemId: number) {
  const byId = new Map(items.map((item) => [item.iditemorganograma, item]));
  const ancestors: number[] = [];
  let current = byId.get(itemId);
  const visited = new Set<number>();
  while (current?.idpai_id != null && !visited.has(current.idpai_id)) {
    visited.add(current.idpai_id);
    ancestors.push(current.idpai_id);
    current = byId.get(current.idpai_id);
  }
  return ancestors;
}
