// src/lib/__tests__/resolveNavigation.test.ts
import { describe, it, expect } from "vitest";
import { resolveNavigation } from "@/lib/resolveNavigation";
import type { NavItemDefinition } from "@/types/navigation";

const items: NavItemDefinition[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "layout-dashboard",
    href: "/dashboard",
    order: 1,
    // sem permissionKey → público
  },
  {
    id: "usuarios",
    label: "Usuários",
    icon: "users",
    href: "/usuarios",
    order: 2,
    permissionKey: "usuarios.view",
  },
  {
    id: "relatorios",
    label: "Relatórios",
    icon: "bar-chart-2",
    href: "/relatorios",
    order: 3,
    permissionKey: "relatorios.view",
    visibleWhenDenied: true, // visível, mas desabilitado
  },
  {
    id: "admin",
    label: "Admin",
    icon: "shield",
    href: "/admin",
    order: 4,
    permissionKey: "admin.manage",
    visibleWhenDenied: false, // completamente oculto se negado
  },
];

describe("resolveNavigation", () => {
  it("item sem permissionKey é sempre enabled e visible", () => {
    const result = resolveNavigation(items, []);
    const dashboard = result.find((i) => i.id === "dashboard")!;
    expect(dashboard.enabled).toBe(true);
    expect(dashboard.visible).toBe(true);
  });

  it("item com permissionKey concedida é enabled e visible", () => {
    const result = resolveNavigation(items, ["usuarios.view"]);
    const usuarios = result.find((i) => i.id === "usuarios")!;
    expect(usuarios.enabled).toBe(true);
    expect(usuarios.visible).toBe(true);
  });

  it("item com permissionKey negada e visibleWhenDenied=true: disabled mas visible", () => {
    const result = resolveNavigation(items, []);
    const relatorios = result.find((i) => i.id === "relatorios")!;
    expect(relatorios.enabled).toBe(false);
    expect(relatorios.visible).toBe(true);
  });

  it("item com permissionKey negada e visibleWhenDenied=false: disabled e hidden", () => {
    const result = resolveNavigation(items, []);
    const admin = result.find((i) => i.id === "admin")!;
    expect(admin.enabled).toBe(false);
    expect(admin.visible).toBe(false);
  });

  it("retorna itens ordenados por order", () => {
    const result = resolveNavigation(items, [
      "usuarios.view",
      "relatorios.view",
    ]);
    const orders = result.map((i) => i.order);
    expect(orders).toEqual([1, 2, 3, 4]);
  });

  it("resolve children recursivamente", () => {
    const withChildren: NavItemDefinition[] = [
      {
        id: "menu",
        label: "Menu",
        icon: "menu",
        href: "/menu",
        order: 1,
        children: [
          {
            id: "sub-a",
            label: "Sub A",
            icon: "dot",
            href: "/menu/sub-a",
            order: 1,
            permissionKey: "sub.view",
          },
        ],
      },
    ];

    const result = resolveNavigation(withChildren, []);
    const subA = result[0].children![0];
    expect(subA.enabled).toBe(false);
    expect(subA.visible).toBe(false);
  });
});
