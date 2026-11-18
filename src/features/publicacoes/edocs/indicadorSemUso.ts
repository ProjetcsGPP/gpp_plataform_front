import type { IndicadorSemUsoEdocsPayload } from "./model";

export interface CompetenciaSemUso {
  ano: number;
  mes: number;
}

export function parseCompetenciaSemUso(
  ativo: boolean,
  ano: string,
  mes: string,
): CompetenciaSemUso | null {
  if (!ativo) return null;
  const normalizedYear = Number(ano);
  const normalizedMonth = Number(mes);
  if (
    !Number.isInteger(normalizedYear)
    || normalizedYear < 2024
    || !Number.isInteger(normalizedMonth)
    || normalizedMonth < 1
    || normalizedMonth > 12
  ) return null;
  return { ano: normalizedYear, mes: normalizedMonth };
}

export function buildIndicadorSemUsoPayload(
  ativo: boolean,
  ano: string,
  mes: string,
  justificativa: string,
): IndicadorSemUsoEdocsPayload | null {
  const trimmedJustification = justificativa.trim();
  if (!trimmedJustification) return null;
  if (!ativo) {
    return {
      municipio_implantado_sem_uso_edocs: false,
      justificativa: trimmedJustification,
    };
  }
  const competencia = parseCompetenciaSemUso(true, ano, mes);
  if (!competencia) return null;
  return {
    municipio_implantado_sem_uso_edocs: true,
    ano_inicio: competencia.ano,
    mes_inicio: competencia.mes,
    justificativa: trimmedJustification,
  };
}

export function formatCompetenciaSemUso(
  ano: number | null,
  mes: number | null,
) {
  if (!ano || !mes) return "Competência não informada";
  return `${String(mes).padStart(2, "0")}/${ano}`;
}
