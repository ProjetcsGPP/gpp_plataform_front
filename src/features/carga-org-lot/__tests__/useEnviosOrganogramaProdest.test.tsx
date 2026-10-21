import { SWRConfig } from "swr";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useEnviosOrganogramaProdest } from "@/features/carga-org-lot/useEnviosOrganogramaProdest";
import * as cargaApi from "@/features/carga-org-lot/api";

vi.mock("@/features/carga-org-lot/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/carga-org-lot/api")>();
  return {
    ...original,
    getAcompanhamentoEnvioOrganograma: vi.fn(),
    listEnviosOrganogramaProdest: vi.fn(),
    consultarStatusEnvioOrganogramaProdest: vi.fn(),
  };
});

describe("dados locais do envio de organograma", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cargaApi.getAcompanhamentoEnvioOrganograma).mockResolvedValue({
      patriarca_id: 9,
      tentativa_ativa: null,
      ultimo_resultado: null,
      bloqueio_novo_envio: false,
      motivo_bloqueio: "",
      eventos_recentes: [],
    });
    vi.mocked(cargaApi.listEnviosOrganogramaProdest).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });
  });

  it("carrega acompanhamento e histórico sem consultar a PRODEST", async () => {
    renderHook(() => useEnviosOrganogramaProdest(9, 1, 10), {
      wrapper: ({ children }) => (
        <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
          {children}
        </SWRConfig>
      ),
    });

    await waitFor(() => expect(cargaApi.getAcompanhamentoEnvioOrganograma).toHaveBeenCalledWith(9));
    expect(cargaApi.listEnviosOrganogramaProdest).toHaveBeenCalledWith(9, {
      page: 1,
      page_size: 10,
    });
    expect(cargaApi.consultarStatusEnvioOrganogramaProdest).not.toHaveBeenCalled();
  });
});
