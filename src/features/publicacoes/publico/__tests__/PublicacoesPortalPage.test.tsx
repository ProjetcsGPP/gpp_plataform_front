import { SWRConfig } from "swr";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PublicDistributionError } from "../model";
import { PublicacoesPortalPage } from "../PublicacoesPortalPage";
import * as publicApi from "../api";
import { publicPublication } from "./fixtures";

vi.mock("../api", () => ({ getCurrentPublicPublication: vi.fn(), getPublicPublication: vi.fn(), listPublicPublications: vi.fn() }));
vi.mock("../PublicacaoPresentation", () => ({ PublicacaoPresentation: ({ publicacao }: { publicacao: typeof publicPublication }) => <div data-testid="presentation">{publicacao.titulo}</div> }));

function setup() { return render(<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}><PublicacoesPortalPage /></SWRConfig>); }

describe("Portal público de Publicações Institucionais", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(publicApi.getCurrentPublicPublication).mockResolvedValue(publicPublication);
    vi.mocked(publicApi.listPublicPublications).mockResolvedValue({ schema_version: "1.0", quantidade: 1, resultados: [publicPublication] });
    vi.mocked(publicApi.getPublicPublication).mockResolvedValue(publicPublication);
  });

  it("exibe a publicação vigente anonimamente e oferece login separado", async () => {
    setup();
    expect(await screen.findByTestId("presentation")).toHaveTextContent("Resultados institucionais");
    expect(screen.getByRole("link", { name: /Entrar/ })).toHaveAttribute("href", "/portal/login");
  });

  it("apresenta ausência vigente como estado público informativo", async () => {
    vi.mocked(publicApi.getCurrentPublicPublication).mockRejectedValue(new PublicDistributionError("PUBLICACAO_NAO_DISPONIVEL", 404, null, "ausente"));
    setup();
    expect(await screen.findByText("Ainda não há publicação disponível")).toBeInTheDocument();
    expect(screen.queryByTestId("presentation")).not.toBeInTheDocument();
  });

  it("consulta histórico público e bloqueia publicação revogada", async () => {
    const user = userEvent.setup();
    vi.mocked(publicApi.getPublicPublication).mockRejectedValue(new PublicDistributionError("PUBLICACAO_REVOGADA", 410, null, "revogada"));
    setup();
    await screen.findByTestId("presentation");
    await user.click(screen.getByRole("button", { name: /Histórico/ }));
    await user.click(await screen.findByRole("button", { name: /Resultados institucionais/ }));
    expect(await screen.findByText("Publicação revogada")).toBeInTheDocument();
    expect(screen.queryByTestId("presentation")).not.toBeInTheDocument();
  });

  it.each([
    ["LIMITE_PUBLICO_EXCEDIDO", 429, 18, "Aguarde aproximadamente 18 segundos"],
    ["PUBLICACAO_TEMPORARIAMENTE_INDISPONIVEL", 503, null, "temporariamente indisponível"],
    ["OFFLINE", null, null, "Você está offline"],
  ] as const)("apresenta o estado público %s", async (code, status, retryAfter, expected) => {
    vi.mocked(publicApi.getCurrentPublicPublication).mockRejectedValue(new PublicDistributionError(code, status, retryAfter, "erro"));
    setup();
    expect(await screen.findByText(new RegExp(expected, "i"))).toBeInTheDocument();
  });
});
