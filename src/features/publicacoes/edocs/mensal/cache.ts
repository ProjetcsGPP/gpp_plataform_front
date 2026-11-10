export const edocsMensalCacheKeys = {
  coletas: (values: readonly unknown[]) =>
    ["pub-institucional:edocs", "mensal-coletas", ...values] as const,
  patriarcas: (values: readonly unknown[]) =>
    ["pub-institucional:edocs", "mensal-patriarcas", ...values] as const,
  organizacoes: (values: readonly unknown[]) =>
    ["pub-institucional:edocs", "mensal-organizacoes", ...values] as const,
  fontes: (values: readonly unknown[]) =>
    ["pub-institucional:edocs", "mensal-fontes", ...values] as const,
  auditoria: (values: readonly unknown[]) =>
    ["pub-institucional:edocs", "mensal-auditoria", ...values] as const,
};
