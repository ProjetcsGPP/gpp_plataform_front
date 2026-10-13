import { describe, expect, it } from "vitest";

import manifest from "../../../public/nav/ACOES_PNGI.json";

describe("manifest ACOES_PNGI", () => {
  it("usa as permissões Django e os nomes de Material Symbols esperados", () => {
    const dashboard = manifest.items.find((item) => item.codigo === "DASHBOARD");
    const acoes = manifest.items.find((item) => item.codigo === "ACOES");

    expect(dashboard?.icon).toBe("dashboard");
    expect(acoes).toMatchObject({
      icon: "checklist",
      permissionKey: "view_acoes",
    });
  });

  it("marca Configurações como controlado por capability e Eixos por permissão", () => {
    const configuracoes = manifest.items.find(
      (item) => item.codigo === "CONFIGURACOES",
    );
    const eixos = configuracoes?.children?.find(
      (item) => item.codigo === "EIXOS",
    );
    const situacoes = configuracoes?.children?.find(
      (item) => item.codigo === "SITUACOES",
    );

    expect(configuracoes).toMatchObject({ capabilityControlled: true });
    expect(eixos).toMatchObject({
      href: "/acoes-pngi/configuracoes/eixos",
      permissionKey: "view_eixo",
      visibleWhenDenied: true,
    });
    expect(situacoes).toMatchObject({
      href: "/acoes-pngi/configuracoes/situacoes",
      permissionKey: "view_situacaoacao",
      visibleWhenDenied: true,
    });
  });
});
