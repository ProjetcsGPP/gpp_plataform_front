import { describe, expect, it } from "vitest";

import { adaptNavigationMenus } from "@/lib/adaptNavigationMenus";
import type {
  Menu,
  NavItemDefinition,
  NavigationMenusResponse,
} from "@/types/navigation";

const manifest: NavItemDefinition[] = [
  {
    id: "admin",
    codigo: "ADMIN",
    label: "Administração antiga",
    icon: "old-icon",
    app: "PORTAL",
    order: 1,
    permissionKey: "view_role",
    visibleWhenDenied: true,
    children: [
      {
        id: "users",
        codigo: "USERS",
        label: "Usuários antigos",
        icon: "old-users",
        app: "PORTAL",
        order: 1,
        permissionKey: "view_user",
        visibleWhenDenied: false,
      },
    ],
  },
];

function menu(overrides: Partial<Menu>): Menu {
  return {
    id: 1,
    codigo: "ADMIN",
    nome: "Administração",
    descricao: "",
    rota: "/portal/admin",
    icone: "admin_panel_settings",
    ordem: 10,
    ativo: true,
    aplicacao_codigo: "PORTAL",
    parent: null,
    capability: { 
      id: 9,
      codigo: "GESTAO",
      nome: "Gestão",
      descricao: "",
      ativo: true,
      aplicacao_id: 1,
      aplicacao_codigo: "PORTAL",
    },
    children: [],
    ...overrides,
  };
}

describe("adaptNavigationMenus", () => {
  it("adapta children recursivamente e preserva a ordem recebida", () => {
    const response: NavigationMenusResponse = {
      app_context: "PORTAL",
      items: [
        menu({ id: 2, codigo: "SECOND", nome: "Segundo", ordem: 20 }),
        menu({
          id: 1,
          children: [
            menu({
              id: 3,
              codigo: "USERS",
              nome: "Usuários",
              rota: "/portal/users",
              icone: "group",
              ordem: 1,
              parent: 1,
              capability: null,
            }),
          ],
        }),
      ],
    };

    const result = adaptNavigationMenus(response, manifest);

    expect(result.map((item) => item.codigo)).toEqual(["SECOND", "ADMIN"]);
    expect(result[1]).toMatchObject({
      id: "1",
      codigo: "ADMIN",
      label: "Administração",
      href: "/portal/admin",
      icon: "admin_panel_settings",
      order: 10,
      permissionKey: "view_role",
      visibleWhenDenied: true,
    });
    expect(result[1].children?.[0]).toMatchObject({
      codigo: "USERS",
      label: "Usuários",
      permissionKey: "view_user",
      visibleWhenDenied: false,
    });
  });

  it("não converte capability em permissionKey", () => {
    const response: NavigationMenusResponse = {
      app_context: "PORTAL",
      items: [menu({ codigo: "WITHOUT_STATIC_METADATA" })],
    };

    const [result] = adaptNavigationMenus(response, manifest);

    expect(result.permissionKey).toBeUndefined();
    expect(result).not.toHaveProperty("capability");
  });

  it("usa apenas codigo para enriquecer metadados técnicos", () => {
    const response: NavigationMenusResponse = {
      app_context: "PORTAL",
      items: [menu({ codigo: "ADMIN", nome: "Nome vindo da API" })],
    };

    const [result] = adaptNavigationMenus(response, manifest);

    expect(result.label).toBe("Nome vindo da API");
    expect(result.permissionKey).toBe("view_role");
  });
});
