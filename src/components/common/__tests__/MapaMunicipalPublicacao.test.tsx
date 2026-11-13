import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SWRConfig } from "swr";

import { MapaMunicipalPublicacao } from "../MapaMunicipalPublicacao";
import { frozenMap } from "@/features/publicacoes/mapa/__tests__/model.test";

vi.mock("next/dynamic", () => ({
  default: () => function FakeLeaflet({ mapa, numeracaoMunicipios, fundoEscuro }: { mapa: typeof frozenMap; numeracaoMunicipios?: Record<string, number>; fundoEscuro?: boolean }) {
    return <div data-testid="leaflet-map" data-dark={fundoEscuro || undefined} data-numbers={JSON.stringify(numeracaoMunicipios ?? {})}>{mapa.titulo}</div>;
  },
}));

const geojson = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", properties: { id: "3200102", name: "Afonso Cláudio" }, geometry: { type: "Polygon", coordinates: [] } },
    { type: "Feature", properties: { id: "3209999", name: "Município ausente" }, geometry: { type: "Polygon", coordinates: [] } },
  ],
};

describe("visualização compartilhada do mapa municipal", () => {
  afterEach(() => vi.unstubAllGlobals());

  function renderMap() {
    return render(<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}><MapaMunicipalPublicacao mapa={frozenMap} /></SWRConfig>);
  }

  it("carrega o GeoJSON local, ordena a legenda e oferece alternativa tabular", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => geojson }));
    renderMap();

    expect(screen.getByRole("status")).toHaveTextContent("Carregando limites municipais");
    await waitFor(() => expect(screen.getByTestId("leaflet-map")).toBeInTheDocument());
    const legendItems = screen.getByRole("list", { name: "Legenda do mapa" }).querySelectorAll("li");
    expect([...legendItems].map((item) => item.textContent)).toEqual(["Sem dados", "Sem uso", "Com uso", "Em implantação", "Manifestou interesse"]);
    expect(screen.getByText("Afonso Cláudio: E-Docs implantado e em uso")).toBeInTheDocument();
    expect(screen.getByText("Município ausente: Sem evidência congelada")).toBeInTheDocument();
  });

  it("expõe erro neutro quando a geometria local não pode ser carregada", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    renderMap();
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar os limites municipais");
  });

  it("divide a apresentação entre municípios informados e mapa escuro", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => geojson }));
    render(<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}><MapaMunicipalPublicacao mapa={frozenMap} dark presentationLayout /></SWRConfig>);
    const municipalities = await screen.findByRole("list", { name: "Municípios com informações" });
    expect(municipalities).toHaveTextContent("Afonso Cláudio");
    expect(municipalities).toHaveTextContent("Alegre");
    expect(municipalities).not.toHaveTextContent("Alfredo Chaves");
    expect(screen.getByRole("heading", { name: "Com uso 1" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sem uso 1" })).toBeInTheDocument();
    const mapLegend = screen.getByRole("list", { name: "Legenda do mapa" });
    expect(mapLegend).not.toHaveTextContent("Sem dados");
    expect(document.querySelector("[data-map-panel]")).toHaveClass("bg-slate-950");
    expect(screen.getByTestId("leaflet-map")).toHaveAttribute("data-dark", "true");
    expect(screen.getByTestId("leaflet-map")).toHaveAttribute("data-numbers", JSON.stringify({ "3200102": 1, "3200201": 2, "3200409": 3, "3200508": 4 }));
  });
});
