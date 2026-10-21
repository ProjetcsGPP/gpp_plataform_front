import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ValidationReportDialog } from "@/features/carga-org-lot/ValidationReportDialog";

const report = {
  codigo: "planilha_invalida",
  mensagem: "A importação foi rejeitada porque a planilha contém erros.",
  leitura_completa: true,
  total_abas_lidas: 2,
  total_linhas_lidas: 303,
  total_erros: 4,
  criar_unidades_espelho: true,
  total_unidades_espelho_criadas: 0,
  erros: [
    { codigo: "sigla_duplicada", mensagem: "Sigla duplicada", aba: "Unidades", linha: 20, campo: "sigla" },
    { codigo: "pai_invalido", mensagem: "Pai inexistente", aba: "Organograma", linha: 4, campo: "pai" },
    { codigo: "pai_ambiguo", mensagem: "Mais de um pai foi encontrado.", aba: "Organograma", linha: 5, campo: "pai" },
    { codigo: "conflito_unidade_espelho", mensagem: "Conflito na unidade automática.", aba: "Organograma", linha: 6, campo: "sigla" },
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
    expect(within(dialog).getByText("pai_ambiguo")).toBeInTheDocument();
    expect(within(dialog).getByText(/utilize numeração composta/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/nome e sigla devem coincidir/i)).toBeInTheDocument();
    expect(within(dialog).getByText("Unidades criadas automaticamente")).toBeInTheDocument();
    expect(within(dialog).getByText("Unidades")).toBeInTheDocument();
  });

  it("explica quando o arquivo está ilegível e permite fechar", () => {
    const onClose = vi.fn();
    render(<ValidationReportDialog report={{ ...report, leitura_completa: false }} onClose={onClose} />);
    expect(screen.getByText(/não pôde ser aberto ou interpretado/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /fechar e corrigir/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("traduz os novos códigos e preserva aba, linha e campo", () => {
    const codes = [
      ["nome_orgao_muito_longo", "O nome do órgão excede 100 caracteres."],
      ["sigla_orgao_muito_longa", "A sigla do órgão excede 20 caracteres."],
      ["nome_unidade_muito_longo", "O nome da unidade excede 100 caracteres."],
      ["sigla_unidade_muito_longa", "A sigla da unidade excede 25 caracteres."],
      ["sigla_duplicada_no_orgao", "Existe outra unidade com a mesma sigla dentro do órgão."],
    ];
    render(
      <ValidationReportDialog
        report={{
          ...report,
          total_erros: codes.length,
          erros: codes.map(([codigo], index) => ({
            codigo,
            mensagem: "Mensagem técnica",
            aba: "Organograma",
            linha: index + 10,
            campo: "sigla",
          })),
        }}
        onClose={vi.fn()}
      />,
    );

    for (const [code, message] of codes) {
      expect(screen.getByText(code)).toBeInTheDocument();
      expect(screen.getByText(message)).toBeInTheDocument();
    }
    expect(screen.getAllByText("Organograma")).toHaveLength(codes.length);
    expect(screen.getAllByText("sigla")).toHaveLength(codes.length);
    expect(screen.getByText("10")).toBeInTheDocument();
  });
});
