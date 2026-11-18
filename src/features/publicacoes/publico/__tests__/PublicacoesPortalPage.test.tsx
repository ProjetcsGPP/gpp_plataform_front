import { SWRConfig } from "swr";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PublicDistributionError } from "../model";
import { PublicacoesPortalPage } from "../PublicacoesPortalPage";
import * as publicApi from "../api";
import { publicPublication } from "./fixtures";

vi.mock("../api", () => ({ getCurrentPublicPublication: vi.fn(), getPublicPublication: vi.fn(), listPublicPublications: vi.fn() }));
vi.mock("../PublicacaoPresentation", () => ({ PublicacaoPresentation: ({ publicacao, toolbarContent }: { publicacao: typeof publicPublication; toolbarContent?: React.ReactNode }) => <div data-testid="presentation">{publicacao.titulo}{toolbarContent}</div> }));

function setup() { return render(<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}><PublicacoesPortalPage /></SWRConfig>); }

const historicalPublication = {
  ...publicPublication,
  id: "22222222-2222-2222-2222-222222222222",
  titulo: "Publicação de Maio de 2024",
  competencia: "2024-05",
  publicada_em: "2024-06-02T10:00:00Z",
};

describe("Portal público de Publicações Institucionais", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(publicApi.getCurrentPublicPublication).mockResolvedValue(publicPublication);
    vi.mocked(publicApi.listPublicPublications).mockResolvedValue({ schema_version: "1.0", quantidade: 2, resultados: [historicalPublication, publicPublication] });
    vi.mocked(publicApi.getPublicPublication).mockResolvedValue(historicalPublication);
  });

  it("exibe a publicação vigente anonimamente e oferece login separado", async () => {
    setup();
    expect(await screen.findByTestId("presentation")).toHaveTextContent("Resultados institucionais");
    expect(screen.getByRole("link", { name: /Entrar/ })).toHaveAttribute("href", "/portal/login");
    expect(screen.queryByRole("button", { name: /Histórico/ })).not.toBeInTheDocument();
    const publicationSelect = screen.getByRole("combobox", { name: "Selecionar publicação" });
    expect(publicationSelect).toHaveValue("");
    expect(publicationSelect).toHaveTextContent("Atual · 2024-06 · versão 1");
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(2));
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
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(2));
    await user.selectOptions(screen.getByRole("combobox", { name: "Selecionar publicação" }), historicalPublication.id);
    expect(await screen.findByText("Publicação revogada")).toBeInTheDocument();
    expect(screen.queryByTestId("presentation")).not.toBeInTheDocument();
  });

  it("ordena o histórico do mais atual para o mais antigo com desempates estáveis", async () => {
    const septemberOlder = { ...historicalPublication, id: "september-older", competencia: "2024-09", versao: 1, publicada_em: "2024-10-01T10:00:00Z", titulo: "Setembro anterior" };
    const septemberNewer = { ...historicalPublication, id: "september-newer", competencia: "2024-09", versao: 1, publicada_em: "2024-10-02T10:00:00Z", titulo: "Setembro mais recente" };
    const augustVersion2 = { ...historicalPublication, id: "august-v2", competencia: "2024-08", versao: 2, publicada_em: "2024-09-02T10:00:00Z", titulo: "Agosto v2" };
    vi.mocked(publicApi.listPublicPublications).mockResolvedValue({
      schema_version: "1.0",
      quantidade: 5,
      resultados: [augustVersion2, septemberOlder, publicPublication, historicalPublication, septemberNewer],
    });
    setup();

    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(5));
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Atual · 2024-06 · versão 1",
      "2024-09 · versão 1 · Setembro mais recente",
      "2024-09 · versão 1 · Setembro anterior",
      "2024-08 · versão 2 · Agosto v2",
      "2024-05 · versão 1 · Publicação de Maio de 2024",
    ]);
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
