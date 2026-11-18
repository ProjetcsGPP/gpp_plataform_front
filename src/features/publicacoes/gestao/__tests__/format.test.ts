import { describe, expect, it } from "vitest";
import { actionAvailable, canUsePublicationAction, formatDecimal, formatNumber, personalizedScopeIsValid, SITUACAO_LABELS } from "../format";

describe("apresentação de publicações", () => {
  it("não deriva ações: consulta somente a lista autoritativa", () => {
    expect(actionAvailable(["publicar"], "publicar")).toBe(true);
    expect(actionAvailable([], "publicar")).toBe(false);
    expect(actionAvailable(["visualizar_previa"], "revogar")).toBe(false);
  });
  it("oculta a ação quando faltar permissão técnica ou ação disponível", () => {
    expect(canUsePublicationAction(true, ["publicar"], "publicar")).toBe(true);
    expect(canUsePublicationAction(false, ["publicar"], "publicar")).toBe(false);
    expect(canUsePublicationAction(true, [], "publicar")).toBe(false);
  });
  it("exige patriarca somente no escopo personalizado", () => {
    expect(personalizedScopeIsValid("PERSONALIZADO", [])).toBe(false);
    expect(personalizedScopeIsValid("PERSONALIZADO", [25])).toBe(true);
    expect(personalizedScopeIsValid("MUNICIPIOS", [])).toBe(true);
  });
  it("traduz situações e apenas formata valores calculados", () => {
    expect(SITUACAO_LABELS.AGUARDANDO_PUBLICACAO).toBe("Aguardando publicação");
    expect(formatNumber("39946")).toBe("39.946");
    expect(formatDecimal("470.3129")).toBe("470,31");
  });
});
