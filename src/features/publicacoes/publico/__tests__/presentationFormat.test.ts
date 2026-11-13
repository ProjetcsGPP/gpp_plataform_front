import { describe, expect, it } from "vitest";

import { formatPublicValue } from "../presentationFormat";

describe("formatação dos indicadores públicos", () => {
  it("limita indicadores fracionados a duas casas decimais", () => {
    expect(formatPublicValue("22057.67501", "kg", 5)).toBe("22.057,68 kg");
    expect(formatPublicValue("470.3129", "árvores", 4)).toBe("470,31 árvores");
  });

  it("preserva inteiros sem casas decimais e valores monetários com duas", () => {
    expect(formatPublicValue("4703129", "páginas", 0)).toBe("4.703.129 páginas");
    expect(formatPublicValue("800435.8", "BRL", 2)).toBe("R$\u00a0800.435,80");
  });
});
