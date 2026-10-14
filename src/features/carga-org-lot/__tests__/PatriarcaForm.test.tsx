import { SWRConfig } from "swr";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PatriarcaForm } from "@/features/carga-org-lot/PatriarcaForm";
import * as cargaApi from "@/features/carga-org-lot/api";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh: vi.fn() }) }));
vi.mock("@/features/carga-org-lot/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/carga-org-lot/api")>();
  return { ...original, listStatusProgresso: vi.fn(), createPatriarca: vi.fn(), updatePatriarca: vi.fn() };
});

const record = { idpatriarca: 1, idexternopatriarca: "uuid-1", strsiglapatriarca: "PMBG", strnome: "Prefeitura", datcriacao: "2026-10-01T12:00:00Z", datalteracao: null, idstatusprogresso_id: 1, status: { idstatusprogresso: 1, strdescricao: "Novo" }, organograma_download_url: "/download/" };

function setup(recordValue?: typeof record) {
  return render(<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}><PatriarcaForm record={recordValue} /></SWRConfig>);
}

describe("formulário de patriarca", () => {
  beforeEach(() => {
    push.mockReset();
    vi.mocked(cargaApi.listStatusProgresso).mockResolvedValue([{ idstatusprogresso: 1, strdescricao: "Novo" }, { idstatusprogresso: 2, strdescricao: "Processado" }]);
    vi.mocked(cargaApi.createPatriarca).mockResolvedValue(record);
    vi.mocked(cargaApi.updatePatriarca).mockResolvedValue(record);
  });

  it("edita os dados sem permitir ou enviar alteração de status", async () => {
    setup(record);
    expect(screen.getByLabelText("Identificador externo")).toHaveValue("uuid-1");
    expect(screen.getByLabelText("Sigla")).toHaveValue("PMBG");
    expect(screen.getByLabelText("Status")).toBeDisabled();
    expect(screen.getByLabelText("Status")).toHaveValue("Novo");
    await userEvent.clear(screen.getByLabelText("Nome"));
    await userEvent.type(screen.getByLabelText("Nome"), "Prefeitura atualizada");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(cargaApi.updatePatriarca).toHaveBeenCalledWith(1, {
      idexternopatriarca: "uuid-1",
      strsiglapatriarca: "PMBG",
      strnome: "Prefeitura atualizada",
    }));
    expect(push).toHaveBeenCalledWith("/carga-org-lot/patriarcas");
  });

  it('cria sempre com o status "Novo" do catálogo', async () => {
    setup();
    expect(await screen.findByLabelText("Status")).toHaveValue("Novo");
    expect(screen.getByLabelText("Status")).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Identificador externo"), "uuid-2");
    await userEvent.type(screen.getByLabelText("Sigla"), "SEG");
    await userEvent.type(screen.getByLabelText("Nome"), "Secretaria");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(cargaApi.createPatriarca).toHaveBeenCalledWith({
      idexternopatriarca: "uuid-2",
      strsiglapatriarca: "SEG",
      strnome: "Secretaria",
      idstatusprogresso_id: 1,
    }));
  });
});
