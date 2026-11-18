import { describe, expect, it } from "vitest";

import {
  buildIndicadorSemUsoPayload,
  formatCompetenciaSemUso,
  parseCompetenciaSemUso,
} from "../indicadorSemUso";

describe("contrato do indicador municipal sem uso do E-Docs", () => {
  it("valida a competência mínima e os limites do mês", () => {
    expect(parseCompetenciaSemUso(true, "2023", "12")).toBeNull();
    expect(parseCompetenciaSemUso(true, "2024", "13")).toBeNull();
    expect(parseCompetenciaSemUso(true, "2024", "6")).toEqual({ ano: 2024, mes: 6 });
  });

  it("omite a competência ao desativar", () => {
    expect(buildIndicadorSemUsoPayload(false, "2024", "6", " Encerrado. ")).toEqual({
      municipio_implantado_sem_uso_edocs: false,
      justificativa: "Encerrado.",
    });
  });

  it("mantém compatibilidade textual com registros legados", () => {
    expect(formatCompetenciaSemUso(null, null)).toBe("Competência não informada");
    expect(formatCompetenciaSemUso(2024, 6)).toBe("06/2024");
  });
});
