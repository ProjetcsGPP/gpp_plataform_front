import { describe, expect, it } from "vitest";

import { eixoResource } from "@/features/acoes-pngi/configuracoes/eixos/resource";
import { situacaoAcaoResource } from "@/features/acoes-pngi/configuracoes/situacoes/resource";
import { PERMISSIONS } from "@/lib/permissions";

describe("recursos administrativos de Ações PNGI", () => {
  it("mantém identidade e permissões específicas por recurso", () => {
    expect(eixoResource.key).toBe("acoes-pngi.configuracoes.eixos");
    expect(eixoResource.permissions).toEqual({
      view: PERMISSIONS.EIXO_VIEW,
      add: PERMISSIONS.EIXO_ADD,
      change: PERMISSIONS.EIXO_CHANGE,
    });
    expect(situacaoAcaoResource.key).toBe(
      "acoes-pngi.configuracoes.situacoes",
    );
    expect(situacaoAcaoResource.permissions).toEqual({
      view: PERMISSIONS.SITUACAOACAO_VIEW,
      add: PERMISSIONS.SITUACAOACAO_ADD,
      change: PERMISSIONS.SITUACAOACAO_CHANGE,
    });
  });

  it("converte valores de formulário apenas para campos editáveis", () => {
    expect(
      eixoResource.toPayload({
        description: "  Transformação Digital  ",
        alias: " TD ",
      }),
    ).toEqual({
      strdescricaoeixo: "Transformação Digital",
      stralias: "TD",
    });
    expect(
      situacaoAcaoResource.toPayload({ description: "  Em andamento  " }),
    ).toEqual({ strdescricaosituacao: "Em andamento" });
  });
});
