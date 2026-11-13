import type { PublicValue } from "./model";

export function formatPublicValue(value: PublicValue | undefined, unit?: string | null, precision?: number | null) {
  if (value === null || value === undefined || value === "") return "Sem dados";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  if (unit === "BRL") return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 }).format(numeric);
  const minimumFractionDigits = Math.min(precision ?? 0, 2);
  const maximumFractionDigits = Math.min(precision ?? 2, 2);
  const formatted = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(numeric);
  return unit ? `${formatted} ${unit}` : formatted;
}

export function latestAccumulatedValue(points: Array<{ valor_acumulado: string | null }>) {
  for (let index = points.length - 1; index >= 0; index -= 1) {
    if (points[index]?.valor_acumulado !== null) return points[index]?.valor_acumulado ?? null;
  }
  return null;
}
