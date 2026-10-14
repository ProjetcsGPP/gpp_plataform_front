import type {
  ItemOrganograma,
  ItemOrganogramaNode,
} from "@/features/carga-org-lot/model";

function compareHierarchy(a: ItemOrganograma, b: ItemOrganograma) {
  const aParts = a.strnumero.split(".").map(Number);
  const bParts = b.strnumero.split(".").map(Number);
  const length = Math.max(aParts.length, bParts.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (aParts[index] ?? 0) - (bParts[index] ?? 0);
    if (difference) return difference;
  }
  return a.intlinhaorigem - b.intlinhaorigem;
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
    list.sort(compareHierarchy);
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
