"use client";

import { useEffect, useState } from "react";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { Layer, Path } from "leaflet";
import { GeoJSON, MapContainer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import type { MapaMunicipalCongelado } from "@/features/publicacoes/mapa/model";
import { resolveMunicipioVisual } from "@/features/publicacoes/mapa/model";

interface MunicipioGeoJsonProperties {
  id: string | number;
  name: string;
  description?: string;
}

export type MunicipiosGeoJson = FeatureCollection<Geometry, MunicipioGeoJsonProperties>;

interface MapaMunicipalLeafletProps {
  geojson: MunicipiosGeoJson;
  mapa: MapaMunicipalCongelado;
  altura: number | string;
  interativo: boolean;
  fundoEscuro?: boolean;
  numeracaoMunicipios?: Record<string, number>;
  codigoSelecionado: string | null;
  onSelecionar: (codigoIbge: string) => void;
}

export function isMapaActivationKey(key: string) {
  return key === "Enter" || key === " ";
}

export function configureAccessibleMapElement(
  element: Element,
  interactive: boolean,
  alternativeText: string,
  onActivate: () => void,
) {
  element.setAttribute("aria-label", alternativeText);
  element.setAttribute("role", interactive ? "button" : "img");
  if (!interactive) return;
  element.setAttribute("tabindex", "0");
  element.addEventListener("keydown", (event) => {
    if (!(event instanceof KeyboardEvent) || !isMapaActivationKey(event.key)) return;
    event.preventDefault();
    onActivate();
  });
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined"
      && typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

function featureIdentity(feature: Feature<Geometry, MunicipioGeoJsonProperties>) {
  return {
    codigo: String(feature.properties?.id ?? ""),
    nome: feature.properties?.name || "Município não identificado",
  };
}

export default function MapaMunicipalLeaflet({
  geojson,
  mapa,
  altura,
  interativo,
  fundoEscuro = false,
  numeracaoMunicipios = {},
  codigoSelecionado,
  onSelecionar,
}: MapaMunicipalLeafletProps) {
  const reducedMotion = useReducedMotion();

  function configureFeature(
    feature: Feature<Geometry, MunicipioGeoJsonProperties>,
    layer: Layer,
  ) {
    const { codigo, nome } = featureIdentity(feature);
    const visual = resolveMunicipioVisual(codigo, nome, mapa);
    const number = numeracaoMunicipios[codigo];
    if (number) {
      layer.bindTooltip(String(number), {
        permanent: true,
        direction: "center",
        className: "municipality-number-label",
        opacity: 1,
      });
    } else {
      layer.bindTooltip(visual.textoAlternativo, { sticky: true });
    }
    layer.on("click", () => {
      if (interativo) onSelecionar(codigo);
    });

    const configureElement = () => {
      const element = (layer as Path).getElement?.();
      if (!element) return;
      configureAccessibleMapElement(
        element,
        interativo,
        visual.textoAlternativo,
        () => onSelecionar(codigo),
      );
    };

    layer.once("add", configureElement);
    configureElement();
  }

  return (
    <MapContainer
      bounds={[
        [-21.35, -41.95],
        [-17.75, -39.55],
      ]}
      maxBounds={[
        [-22.2, -42.8],
        [-16.9, -38.7],
      ]}
      scrollWheelZoom={false}
      dragging={interativo}
      zoomControl={interativo}
      doubleClickZoom={interativo}
      attributionControl={false}
      preferCanvas={false}
      zoomAnimation={!reducedMotion}
      fadeAnimation={!reducedMotion}
      markerZoomAnimation={!reducedMotion}
      className={`z-0 rounded-xl ${fundoEscuro ? "publication-map-dark" : "bg-slate-50"}`}
      style={{ height: typeof altura === "number" ? `${altura}px` : altura, width: "100%" }}
    >
      <GeoJSON
        data={geojson}
        style={(feature) => {
          const { codigo, nome } = featureIdentity(
            feature as Feature<Geometry, MunicipioGeoJsonProperties>,
          );
          const visual = resolveMunicipioVisual(codigo, nome, mapa);
          const selected = codigoSelecionado === codigo;
          return {
            fillColor: visual.cor,
            color: selected ? (fundoEscuro ? "#f8fafc" : "#0f172a") : "#ffffff",
            weight: selected ? 3.5 : 0.8,
            fillOpacity: selected ? 1 : 0.9,
          };
        }}
        onEachFeature={configureFeature}
      />
    </MapContainer>
  );
}
