export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes.toLocaleString("pt-BR")} B`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} KB`;
  }
  return `${(bytes / (1024 * 1024)).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;
}

export function formatPercent(value: string): string {
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) return value;
  return `${numeric.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}
