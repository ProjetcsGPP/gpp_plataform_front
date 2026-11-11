export function formatInteger(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDecimal(
  value: string,
  maximumFractionDigits: number,
  minimumFractionDigits = 0,
) {
  const [rawInteger, rawFraction = ""] = value.split(".");
  const sign = rawInteger.startsWith("-") ? "-" : "";
  const integer = rawInteger.replace("-", "").replace(/^0+(?=\d)/, "") || "0";
  const groupedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const limitedFraction = rawFraction.slice(0, maximumFractionDigits);
  const significantFraction = limitedFraction
    .replace(/0+$/, "")
    .padEnd(minimumFractionDigits, "0");
  return `${sign}${groupedInteger}${significantFraction ? `,${significantFraction}` : ""}`;
}

export function formatDecimalUnit(
  value: string,
  unit: string,
  maximumFractionDigits: number,
) {
  return `${formatDecimal(value, maximumFractionDigits)} ${unit}`;
}

export function formatCurrency(value: string) {
  return `R$ ${formatDecimal(value, 2, 2)}`;
}
