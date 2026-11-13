import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("fundação cartográfica institucional", () => {
  it("mantém os 78 municípios no arquivo local", () => {
    const geojson = JSON.parse(readFileSync(resolve(process.cwd(), "public/data/geojs-32-mun.json"), "utf8"));
    expect(geojson.features).toHaveLength(78);
  });

  it("não conserva dados fictícios nem dependência de TileLayer no componente", () => {
    const prototype = readFileSync(resolve(process.cwd(), "src/components/common/GeoJSON.tsx"), "utf8");
    const leaflet = readFileSync(resolve(process.cwd(), "src/components/common/MapaMunicipalLeaflet.tsx"), "utf8");
    expect(prototype).not.toContain("3200136");
    expect(leaflet).not.toContain("TileLayer");
    expect(leaflet).not.toContain("openstreetmap.org");
  });
});
