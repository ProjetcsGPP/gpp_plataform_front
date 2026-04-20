import { describe, it, expect } from "vitest";
import { resolveNavigation } from "@/lib/resolveNavigation";
import type { NavItemDefinition } from "@/types/navigation";

const items: NavItemDefinition[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "layout-dashboard",
    app: "PORTAL",
    href: "/dashboard",
    order: 1,
  },
  {
    id: "usuarios",
    label: "Usuários",
    icon: "users",
    app: "PORTAL",
    href: "/usuarios",
    order: 2,
    permissionKey: "usuarios.view",
  },
  {
    id: "relatorios",
    label: "Relatórios",
    icon: "bar-chart-2",
    app: "PORTAL",
    href: "/relatorios",
    order: 3,
    permissionKey: "relatorios.view",
    visibleWhenDenied: true,
  },
  {
    id: "admin",
    label: "Admin",
    icon: "shield",
    app: "PORTAL",
    href: "/admin",
    order: 4,
    permissionKey: "admin.manage",
    visibleWhenDenied: false,
  },
  {
    id: "acoes-dashboard",
    label: "Dashboard Ações",
    icon: "layout-dashboard",
    app: "ACOES_PNGI",
    href: "/acoes-pngi/dashboard",
    order: 5,
  },
];

describe("resolveNavigation", () => {
  it("item sem permissionKey é sempre enabled e visible", () => {
    const result = resolveNavigation(items, [], "PORTAL");
    const dashboard = result.find((i) => i.id === "dashboard")!;
    expect(dashboard.enabled).toBe(true);
    expect(dashboard.visible).toBe(true);
  });

  it("item com permissionKey concedida é enabled e visible", () => {
    const result = resolveNavigation(items, ["usuarios.view"], "PORTAL");
    const usuarios = result.find((i) => i.id === "usuarios")!;
    expect(usuarios.enabled).toBe(true);
    expect(usuarios.visible).toBe(true);
  });

  it("item com permissionKey negada e visibleWhenDenied=true: disabled mas visible", () => {
    const result = resolveNavigation(items, [], "PORTAL");
    const relatorios = result.find((i) => i.id === "relatorios")!;
    expect(relatorios.enabled).toBe(false);
    expect(relatorios.visible).toBe(true);
  });

  it("item com permissionKey negada e visibleWhenDenied=false: disabled e hidden", () => {
    const result = resolveNavigation(items, [], "PORTAL");
    const admin = result.find((i) => i.id === "admin")!;
    expect(admin.enabled).toBe(false);
    expect(admin.visible).toBe(false);
  });

  it("retorna itens ordenados por order", () => {
    const result = resolveNavigation(
      items,
      ["usuarios.view", "relatorios.view"],
      "PORTAL",
    );
    const orders = result.map((i) => i.order);
    expect(orders).toEqual([1, 2, 3, 4]);
  });

  it("resolve children recursivamente", () => {
    const withChildren: NavItemDefinition[] = [
      {
        id: "menu",
        label: "Menu",
        icon: "menu",
        app: "PORTAL",
        href: "/menu",
        order: 1,
        children: [
          {
            id: "sub-a",
            label: "Sub A",
            icon: "dot",
            app: "PORTAL",
            href: "/menu/sub-a",
            order: 1,
            permissionKey: "sub.view",
          },
        ],
      },
    ];

    const result = resolveNavigation(withChildren, [], "PORTAL");
    const subA = result[0].children![0];
    expect(subA.enabled).toBe(false);
    expect(subA.visible).toBe(false);
  });

  it("não inclui itens de outro app", () => {
    const result = resolveNavigation(items, [], "PORTAL");
    expect(result.some((i) => i.id === "acoes-dashboard")).toBe(false);
  });
});
