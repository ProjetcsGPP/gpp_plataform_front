import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DivergenciaDialog } from "@/features/publicacoes/edocs/DivergenciasEdocsPage";
import type { DivergenciaPatriarcaEdocs } from "@/features/publicacoes/edocs/model";

const divergence: DivergenciaPatriarcaEdocs = {
  id: 9,
  coleta_id: "64b5cc45-4db0-4f95-8903-e1b28c3c531c",
  patriarca_id: null,
  id_externo: "b817315b-63ea-417e-b191-6ecbc42e56e4",
  comparacao: "NOVO",
  situacao: "PENDENTE",
  dados_esperados: {},
  dados_observados: { nome: "Município" },
  campos_alterados: [],
  decisao: "",
  justificativa: "",
  revisado_por_id: null,
  revisado_por_nome: "",
  revisado_em: null,
  criado_em: "2026-11-09T10:00:00-03:00",
  decisoes_permitidas: ["ADICIONAR", "MANTER"],
  acoes_disponiveis: ["decidir"],
};

describe("DivergenciaDialog", () => {
  it("oferece somente as decisões permitidas pelo payload", async () => {
    const user = userEvent.setup();
    const onDecide = vi.fn().mockResolvedValue(undefined);
    render(
      <DivergenciaDialog
        divergence={divergence}
        canDecide
        onClose={vi.fn()}
        onDecide={onDecide}
      />,
    );

    const decision = screen.getByLabelText("Decisão");
    expect(screen.getByRole("option", { name: "ADICIONAR" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "MANTER" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "ATUALIZAR" })).not.toBeInTheDocument();

    await user.selectOptions(decision, "ADICIONAR");
    await user.type(screen.getByLabelText("Justificativa"), "Cadastro confirmado.");
    await user.click(screen.getByRole("button", { name: "Aplicar decisão" }));

    expect(onDecide).toHaveBeenCalledWith(
      "ADICIONAR",
      "Cadastro confirmado.",
      false,
    );
  });

  it("não oferece decisão quando a ação autoritativa não está disponível", () => {
    render(
      <DivergenciaDialog
        divergence={{ ...divergence, acoes_disponiveis: [] }}
        canDecide={false}
        onClose={vi.fn()}
        onDecide={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText("Decisão")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aplicar decisão" })).not.toBeInTheDocument();
  });
});
