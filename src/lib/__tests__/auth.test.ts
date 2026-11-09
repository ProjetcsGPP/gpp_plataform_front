import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiGet, apiPost, ensureCsrfCookie } = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  ensureCsrfCookie: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  default: { get: apiGet, post: apiPost },
  ensureCsrfCookie,
}));

import { getAplicacoesPublicas, login, logoutApp, switchApp } from "@/lib/auth";

describe("contrato de autenticação", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureCsrfCookie.mockResolvedValue("csrf");
    apiGet.mockResolvedValue({ data: [] });
    apiPost.mockResolvedValue({ data: {} });
  });

  it.each(["maria", "maria@es.gov.br", "identificador-opaco"])(
    "envia %s sem resolução prévia e sem campo username",
    async (identifier) => {
      await login(identifier, "segredo", "PORTAL");

      expect(ensureCsrfCookie).toHaveBeenCalledOnce();
      expect(apiPost).toHaveBeenCalledWith(
        "/accounts/login/",
        { identifier, password: "segredo", app_context: "PORTAL" },
        { gppAuthMode: "public" },
      );
      expect(apiGet).not.toHaveBeenCalled();
      expect(apiPost.mock.calls[0][1]).not.toHaveProperty("username");
    },
  );

  it("marca a listagem pública para não disparar fluxo de sessão expirada", async () => {
    await getAplicacoesPublicas();
    expect(apiGet).toHaveBeenCalledWith("/accounts/auth/aplicacoes/", {
      gppAuthMode: "public",
    });
  });

  it("faz logout somente da aplicação indicada", async () => {
    await logoutApp("CARGA_ORG_LOT");
    expect(apiPost).toHaveBeenCalledWith("/accounts/logout/carga-org-lot/");
  });

  it("autentica Publicações com o contexto canônico", async () => {
    await login("maria", "segredo", "PUB_INSTITUCIONAL");

    expect(apiPost).toHaveBeenCalledWith(
      "/accounts/login/",
      {
        identifier: "maria",
        password: "segredo",
        app_context: "PUB_INSTITUCIONAL",
      },
      { gppAuthMode: "public" },
    );
  });

  it("usa o slug IAM no logout de Publicações", async () => {
    await logoutApp("PUB_INSTITUCIONAL");
    expect(apiPost).toHaveBeenCalledWith(
      "/accounts/logout/pub-institucional/",
    );
  });

  it("troca aplicação enviando apenas o contexto", async () => {
    await switchApp("ACOES_PNGI");
    expect(apiPost).toHaveBeenCalledWith("/accounts/switch-app/", {
      app_context: "ACOES_PNGI",
    });
  });
});
