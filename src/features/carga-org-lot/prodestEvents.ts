import type { EventoIntegracaoProdest } from "@/features/carga-org-lot/model";

export function mergeOperationalEvents(
  current: EventoIntegracaoProdest[],
  incoming: EventoIntegracaoProdest[],
) {
  const merged = new Map<number, EventoIntegracaoProdest>();
  current
    .filter((event) => event.strvisibilidade === "OPERACIONAL")
    .forEach((event) => merged.set(event.ideventointegracao, event));
  incoming
    .filter((event) => event.strvisibilidade === "OPERACIONAL")
    .forEach((event) => merged.set(event.ideventointegracao, event));
  return [...merged.values()].sort(
    (left, right) => left.ideventointegracao - right.ideventointegracao,
  );
}
