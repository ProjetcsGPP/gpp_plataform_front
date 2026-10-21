export function formatOrganogramaValidationMessage(
  code: string,
  message: string,
) {
  const standardMessages: Record<string, string> = {
    nome_orgao_muito_longo: "O nome do órgão excede 100 caracteres.",
    sigla_orgao_muito_longa: "A sigla do órgão excede 20 caracteres.",
    nome_unidade_muito_longo: "O nome da unidade excede 100 caracteres.",
    sigla_unidade_muito_longa: "A sigla da unidade excede 25 caracteres.",
    sigla_duplicada_no_orgao:
      "Existe outra unidade com a mesma sigla dentro do órgão.",
  };
  if (standardMessages[code]) return standardMessages[code];
  if (code === "pai_ambiguo") {
    return `${message} Revise a hierarquia informada ou utilize numeração composta para identificar o pai sem ambiguidade.`;
  }
  if (code === "conflito_unidade_espelho") {
    return `${message} Revise os filhos diretos do órgão: nome e sigla devem coincidir para que a unidade existente seja reutilizada.`;
  }
  return message;
}
