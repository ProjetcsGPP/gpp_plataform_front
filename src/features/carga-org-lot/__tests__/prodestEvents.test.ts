import { describe, expect, it } from "vitest";

import type { EventoIntegracaoProdest } from "@/features/carga-org-lot/model";
import { mergeOperationalEvents } from "@/features/carga-org-lot/prodestEvents";

function event(id: number, visibility: "OPERACIONAL" | "TECNICA" = "OPERACIONAL") {
  return {
    ideventointegracao: id,
    strvisibilidade: visibility,
    strmensagem: `Evento ${id}`,
  } as EventoIntegracaoProdest;
}

describe("eventos operacionais da PRODEST", () => {
  it("deduplica por identificador, remove eventos técnicos e ordena cronologicamente", () => {
    const merged = mergeOperationalEvents(
      [event(3), event(1)],
      [event(2), { ...event(3), strmensagem: "Evento atualizado" }, event(4, "TECNICA")],
    );
    expect(merged.map((item) => item.ideventointegracao)).toEqual([1, 2, 3]);
    expect(merged[2].strmensagem).toBe("Evento atualizado");
  });
});
