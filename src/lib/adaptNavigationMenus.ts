import type {
  Menu,
  NavItemDefinition,
  NavigationMenusResponse,
} from "@/types/navigation";

type AuthorizationMetadata = Pick<
  NavItemDefinition,
  "permissionKey" | "visibleWhenDenied"
>;

function indexAuthorizationMetadata(
  items: NavItemDefinition[],
  result = new Map<string, AuthorizationMetadata>(),
): Map<string, AuthorizationMetadata> {
  for (const item of items) {
    if (item.codigo) {
      result.set(item.codigo, {
        permissionKey: item.permissionKey,
        visibleWhenDenied: item.visibleWhenDenied,
      });
    }

    if (item.children) indexAuthorizationMetadata(item.children, result);
  }

  return result;
}

function adaptMenu(
  menu: Menu,
  metadata: Map<string, AuthorizationMetadata>,
): NavItemDefinition {
  const authorization = metadata.get(menu.codigo);

  return {
    id: String(menu.id),
    codigo: menu.codigo,
    label: menu.nome,
    icon: menu.icone,
    app: menu.aplicacao_codigo,
    href: menu.rota ?? undefined,
    order: menu.ordem,
    permissionKey: authorization?.permissionKey,
    visibleWhenDenied: authorization?.visibleWhenDenied,
    children: menu.children.map((child) =>
      adaptMenu(child, metadata),
    ),
  };
}

/**
 * Converte o contrato funcional do backend para o contrato visual existente.
 * Capability não participa deste mapeamento de autorização: a autorização
 * técnica continua vindo exclusivamente dos metadados do manifest.
 */
export function adaptNavigationMenus(
  response: NavigationMenusResponse,
  manifestItems: NavItemDefinition[],
): NavItemDefinition[] {
  const metadata = indexAuthorizationMetadata(manifestItems);

  return response.items.map((menu) =>
    adaptMenu(menu, metadata),
  );
}
