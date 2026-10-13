// src/components/common/__tests__/NavItemGroup.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";

vi.mock("@/components/common/NavItem", () => ({
  NavItem: ({
    label,
    onClick,
    disabled,
  }: {
    label: string;
    onClick?: () => void;
    disabled?: boolean;
  }) =>
    React.createElement(
      "button",
      { onClick, disabled, "data-testid": `nav-${label}` },
      label,
    ),
}));

import type { ResolvedNavItem } from "@/types/navigation";

const makeGroup = (
  overrides: Partial<Omit<ResolvedNavItem, "app">> = {},
): ResolvedNavItem => ({
  id: "gestao",
  label: "Gestão",
  icon: "manage_accounts",
  app: "PORTAL",
  order: 1,
  enabled: true,
  visible: true,
  children: [
    {
      id: "usuarios",
      label: "Usuários",
      href: "/portal/dashboard/usuarios",
      icon: "group",
      app: "PORTAL",
      order: 1,
      enabled: true,
      visible: true,
    },
    {
      id: "perfis",
      label: "Perfis",
      href: "/portal/dashboard/perfis",
      icon: "badge",
      app: "PORTAL",
      order: 2,
      enabled: false,
      visible: false,
    },
  ],
  ...overrides,
});

describe("NavItemGroup", () => {
  it("filhos com visible: false não são renderizados", async () => {
    const { NavItemGroup } = await import("@/components/common/NavItemGroup");
    const item = makeGroup();

    render(
      <NavItemGroup
        item={item}
        isExpanded={true}
        pathname="/portal/dashboard"
        onNavigate={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("nav-Gestão"));

    expect(screen.getByTestId("nav-Usuários")).toBeInTheDocument();
    expect(screen.queryByTestId("nav-Perfis")).not.toBeInTheDocument();
  });

  it("grupo sem filhos visíveis não renderiza o cabeçalho", async () => {
    const { NavItemGroup } = await import("@/components/common/NavItemGroup");
    const item = makeGroup({
      children: [
        {
          id: "x",
          label: "Oculto",
          href: "/x",
          icon: "x",
          app: "PORTAL",
          order: 1,
          enabled: false,
          visible: false,
        },
      ],
    });

    const { container } = render(
      <NavItemGroup
        item={item}
        isExpanded={true}
        pathname="/"
        onNavigate={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("grupo sem href não navega na sidebar colapsada", async () => {
    const { NavItemGroup } = await import("@/components/common/NavItemGroup");
    const onNavigate = vi.fn();
    const item = makeGroup({ href: undefined });

    render(
      <NavItemGroup
        item={item}
        isExpanded={false}
        pathname="/"
        onNavigate={onNavigate}
      />,
    );

    fireEvent.click(screen.getByTestId("nav-Gestão"));
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("grupo com href navega na sidebar colapsada", async () => {
    const { NavItemGroup } = await import("@/components/common/NavItemGroup");
    const onNavigate = vi.fn();
    const item = makeGroup({ href: "/portal/dashboard/gestao" });

    render(
      <NavItemGroup
        item={item}
        isExpanded={false}
        pathname="/"
        onNavigate={onNavigate}
      />,
    );

    fireEvent.click(screen.getByTestId("nav-Gestão"));
    expect(onNavigate).toHaveBeenCalledWith("/portal/dashboard/gestao");
  });

  it("filho com enabled: false renderiza desabilitado e não navega", async () => {
    const { NavItemGroup } = await import("@/components/common/NavItemGroup");
    const onNavigate = vi.fn();
    const item = makeGroup({
      children: [
        {
          id: "bloqueado",
          label: "Bloqueado",
          href: "/x",
          icon: "lock",
          order: 1,
          app: "PORTAL",
          enabled: false,
          visible: true,
        },
      ],
    });

    render(
      <NavItemGroup
        item={item}
        isExpanded={true}
        pathname="/"
        onNavigate={onNavigate}
      />,
    );

    fireEvent.click(screen.getByTestId("nav-Gestão"));

    const btn = screen.getByTestId("nav-Bloqueado");
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("renderiza os filhos de Configurações em um grupo visualmente indentado", async () => {
    const { NavItemGroup } = await import("@/components/common/NavItemGroup");
    const labels = [
      "Eixos",
      "Situações",
      "Tipos de Entrave/Alerta",
      "Tipos de Anotação/Alinhamento",
      "Vigências",
    ];
    const item = makeGroup({
      id: "configuracoes",
      codigo: "CONFIGURACOES",
      label: "Configurações",
      children: labels.map((label, index) => ({
        id: `config-${index}`,
        codigo: `CONFIG_${index}`,
        label,
        href: `/acoes-pngi/configuracoes/${index}`,
        icon: "settings",
        app: "ACOES_PNGI",
        order: 301 + index,
        enabled: true,
        visible: true,
      })),
    });

    render(
      <NavItemGroup
        item={{ ...item, app: "ACOES_PNGI" }}
        isExpanded={true}
        pathname="/acoes-pngi/dashboard"
        onNavigate={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("nav-Configurações"));

    const submenu = screen.getByRole("group", {
      name: "Submenu de Configurações",
    });
    expect(submenu).toHaveClass("ml-4", "border-l", "pl-2");
    for (const label of labels) {
      expect(screen.getByTestId(`nav-${label}`)).toBeInTheDocument();
    }
  });
});
