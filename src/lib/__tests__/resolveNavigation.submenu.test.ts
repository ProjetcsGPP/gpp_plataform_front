import { describe, it, expect } from "vitest";
import { resolveNavigation } from "@/lib/resolveNavigation";
import type { NavItemDefinition } from "@/types/navigation";

const groupManifest: NavItemDefinition[] = [
  {
    id: "gestao",
    label: "Gestao",
    icon: "manage_accounts",
    app: "PORTAL",
    order: 1,
    children: [
      {
        id: "usuarios",
        label: "Usuarios",
        href: "/portal/usuarios",
        icon: "group",
        app: "PORTAL",
        order: 1,
        permissionKey: "view_user",
      },
      {
        id: "perfis",
        label: "Perfis",
        href: "/portal/perfis",
        icon: "badge",
        app: "PORTAL",
        order: 2,
        permissionKey: "view_userprofile",
      },
      {
        id: "acoes-interno",
        label: "Ações interno",
        href: "/acoes-pngi/acoes",
        icon: "list-checks",
        app: "ACOES_PNGI",
        order: 3,
        permissionKey: "acoes.view",
      },
    ],
  },
];

describe("resolveNavigation — grupos e submenus", () => {
  it("grupo com todos os filhos negados: visible false em todos os filhos", () => {
    const result = resolveNavigation(groupManifest, [], "PORTAL");
    const group = result[0];
    expect(group.children?.every((c) => c.visible === false)).toBe(true);
  });

  it("grupo sem permissionKey e filhos negados: grupo enabled=true", () => {
    const result = resolveNavigation(groupManifest, [], "PORTAL");
    const group = result[0];
    expect(group.enabled).toBe(true);
  });

  it("grupo com permissionKey negada e visibleWhenDenied: visible=true mas enabled=false", () => {
    const manifest: NavItemDefinition[] = [
      {
        ...groupManifest[0],
        permissionKey: "view_role",
        visibleWhenDenied: true,
      },
    ];

    const result = resolveNavigation(manifest, [], "PORTAL");
    const group = result[0];
    expect(group.visible).toBe(true);
    expect(group.enabled).toBe(false);
  });

  it("quando granted inclui permissão de um filho, esse filho fica visible e enabled", () => {
    const result = resolveNavigation(groupManifest, ["view_user"], "PORTAL");
    const group = result[0];
    const usuarios = group.children?.find((c) => c.id === "usuarios");
    const perfis = group.children?.find((c) => c.id === "perfis");

    expect(usuarios?.visible).toBe(true);
    expect(usuarios?.enabled).toBe(true);
    expect(perfis?.visible).toBe(false);
  });

  it("submenu de outro app não aparece", () => {
    const result = resolveNavigation(groupManifest, ["acoes.view"], "PORTAL");
    const group = result[0];
    expect(group.children?.some((c) => c.id === "acoes-interno")).toBe(false);
  });

  it("submenu N níveis: resolução recursiva preserva visible/enabled", () => {
    const deepManifest: NavItemDefinition[] = [
      {
        id: "nivel1",
        label: "Nivel 1",
        icon: "folder",
        app: "PORTAL",
        order: 1,
        children: [
          {
            id: "nivel2",
            label: "Nivel 2",
            icon: "folder_open",
            app: "PORTAL",
            order: 1,
            children: [
              {
                id: "nivel3",
                label: "Nivel 3",
                href: "/deep",
                icon: "description",
                app: "PORTAL",
                order: 1,
                permissionKey: "view_aplicacao",
              },
            ],
          },
        ],
      },
    ];

    const result = resolveNavigation(
      deepManifest,
      ["view_aplicacao"],
      "PORTAL",
    );
    const n1 = result[0];
    const n2 = n1.children?.[0];
    const n3 = n2?.children?.[0];

    expect(n3?.visible).toBe(true);
    expect(n3?.enabled).toBe(true);
    expect(n2?.visible).toBe(true);
    expect(n1?.visible).toBe(true);
  });
});
