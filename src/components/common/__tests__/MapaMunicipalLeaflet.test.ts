import { describe, expect, it, vi } from "vitest";

import { configureAccessibleMapElement, isMapaActivationKey } from "../MapaMunicipalLeaflet";

describe("acessibilidade do mapa Leaflet", () => {
  it("aceita Enter e Espaço como ativação por teclado", () => {
    expect(isMapaActivationKey("Enter")).toBe(true);
    expect(isMapaActivationKey(" ")).toBe(true);
    expect(isMapaActivationKey("Escape")).toBe(false);
  });

  it("torna cada geometria selecionável e preserva o texto alternativo", () => {
    const element = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const activate = vi.fn();
    configureAccessibleMapElement(element, true, "Alegre: implantado", activate);
    expect(element).toHaveAttribute("role", "button");
    expect(element).toHaveAttribute("tabindex", "0");
    expect(element).toHaveAttribute("aria-label", "Alegre: implantado");
    element.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(activate).toHaveBeenCalledOnce();
  });
});
