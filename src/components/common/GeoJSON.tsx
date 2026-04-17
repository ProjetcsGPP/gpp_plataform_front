"use client";
import type { GeoJsonObject } from "geojson";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type Municipio = {
  id: string;
  name: string;
};

export default function MapClient() {
  const [geojson, setGeojson] = useState<GeoJsonObject | null>(null);
  const [hovered, setHovered] = useState<Municipio | null>(null);
  const [selected, setSelected] = useState<Municipio | null>(null);

  useEffect(() => {
    fetch("/data/geojs-32-mun.json")
      .then((res) => res.json())
      .then((data) => setGeojson(data));
  }, []);

  const dados: Record<string, { status: string; valor?: number }> = {
    "3200102": { status: "ok", valor: 120 },
    "3200136": { status: "alerta", valor: 75 },
  };

  const getColor = (id: string) => {
    if (selected?.id === id) return "#111827";

    if (!dados[id]) return "#E5E7EB";

    switch (dados[id].status) {
      case "ok":
        return "#22C55E";
      case "alerta":
        return "#F59E0B";
      case "erro":
        return "#EF4444";
      default:
        return "#E5E7EB";
    }
  };

  if (!geojson) return <p>Carregando mapa...</p>;

  return (
    <div className="relative w-full">
      <MapContainer
        center={[-19.5, -40.5]}
        zoom={7}
        style={{ height: "500px", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <GeoJSON
          data={geojson}
          style={(feature) => ({
            fillColor: getColor((feature?.properties as any)?.id),
            color: "#FFF",
            weight: 0.5,
            fillOpacity: 1,
          })}
          onEachFeature={(feature, layer) => {
            const props = feature.properties as any;
            const id = props.id;
            const name = props.name;

            layer.on({
              mouseover: () => setHovered({ id, name }),
              mouseout: () => setHovered(null),
              click: () => setSelected({ id, name }),
            });
          }}
        />
      </MapContainer>

      {/* TOOLTIP */}
      {hovered && (
        <div className="absolute bottom-4 left-4 bg-white shadow-xl rounded-2xl p-4 text-sm w-64">
          <h3 className="font-bold text-lg">{hovered.name}</h3>

          {dados[hovered.id] ? (
            <>
              <p>Status: {dados[hovered.id].status}</p>
              <p>Valor: {dados[hovered.id].valor}</p>
            </>
          ) : (
            <p>Sem dados</p>
          )}
        </div>
      )}

      {/* SELECIONADO */}
      {selected && (
        <div className="absolute top-4 right-4 bg-black text-white rounded-xl p-3">
          Selecionado: {selected.name}
        </div>
      )}
    </div>
  );
}
