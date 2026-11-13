import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SWRConfig } from "swr";

import {
  MapaMunicipalPublicacao,
  resolveMunicipalityListDensity,
} from "../MapaMunicipalPublicacao";
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

  it("reduz progressivamente a densidade da lista conforme a quantidade", () => {
    expect(resolveMunicipalityListDensity(9)).toBe("comfortable");
    expect(resolveMunicipalityListDensity(10)).toBe("compact");
    expect(resolveMunicipalityListDensity(19)).toBe("compact");
    expect(resolveMunicipalityListDensity(20)).toBe("dense");
  });

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
    expect(municipalities).toHaveAttribute("data-density", "comfortable");
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

    const details = screen.getByRole("region", { name: "Informações do município selecionado" });
    expect(details).toHaveTextContent("Selecione um município na lista ou no mapa");
    fireEvent.click(within(municipalities).getByRole("button", { name: "1 Afonso Cláudio" }));
    expect(details).toHaveTextContent("Afonso Cláudio");
    expect(details).toHaveTextContent("Com uso");
    expect(details).toHaveTextContent("Competência 2026-10");
    expect(details).toHaveTextContent("Afonso Cláudio: E-Docs implantado e em uso");
    expect(within(details).getByRole("table", { name: "Indicadores E-Docs de Afonso Cláudio na competência e acumulados" })).toBeInTheDocument();
    expect(details).toHaveTextContent("10");
    expect(details).toHaveTextContent("100");
    expect(details).toHaveTextContent("R$ 40,50");
    expect(details).toHaveTextContent("R$ 400,50");
    expect(details).toHaveTextContent("Acumulado de 3 competências");
    expect(details).toHaveTextContent("Indicadores E-Flow");
    expect(details).toHaveTextContent("15");
    expect(details).toHaveTextContent("4");
    expect(details).toHaveTextContent("7");
    expect(details).toHaveTextContent("SEMAD");
    expect(details).toHaveTextContent("60,00 %");
    expect(details).toHaveTextContent("CIDADÃO");
    expect(details).toHaveTextContent("80,00 %");
    expect(document.querySelector("[data-map-panel] p[aria-live='polite']")).not.toBeInTheDocument();
  });
});
