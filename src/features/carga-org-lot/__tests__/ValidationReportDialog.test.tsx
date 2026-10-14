import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ValidationReportDialog } from "@/features/carga-org-lot/ValidationReportDialog";

const report = {
  codigo: "planilha_invalida",
  mensagem: "A importação foi rejeitada porque a planilha contém erros.",
  leitura_completa: true,
  total_abas_lidas: 2,
  total_linhas_lidas: 303,
  total_erros: 2,
  erros: [
    { codigo: "sigla_duplicada", mensagem: "Sigla duplicada", aba: "Unidades", linha: 20, campo: "sigla" },
    { codigo: "pai_invalido", mensagem: "Pai inexistente", aba: "Organograma", linha: 4, campo: "pai" },
  ],
};

describe("relatório de validação", () => {
  it("mostra resumo e todos os erros retornados, sem substituí-los por mensagem genérica", () => {
    render(<ValidationReportDialog report={report} onClose={vi.fn()} />);
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(report.mensagem)).toBeInTheDocument();
    expect(within(dialog).getByText("303")).toBeInTheDocument();
    expect(within(dialog).getByText("sigla_duplicada")).toBeInTheDocument();
    expect(within(dialog).getByText("pai_invalido")).toBeInTheDocument();
    expect(within(dialog).getByText("Unidades")).toBeInTheDocument();
  });

  it("explica quando o arquivo está ilegível e permite fechar", () => {
    const onClose = vi.fn();
    render(<ValidationReportDialog report={{ ...report, leitura_completa: false }} onClose={onClose} />);
    expect(screen.getByText(/não pôde ser aberto ou interpretado/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /fechar e corrigir/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
