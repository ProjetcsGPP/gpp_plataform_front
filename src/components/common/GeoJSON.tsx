'use client'

import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from "react-simple-maps"

import { motion } from "framer-motion"
import { useState } from "react"
import geojson from '@/data/geojs-32-mun.json'

type Municipio = {
  id: string
  name: string
}

export default function MapaES() {
  const [hovered, setHovered] = useState<Municipio | null>(null)
  const [selected, setSelected] = useState<Municipio | null>(null)

  const dados: Record<string, { status: string; valor?: number }> = {
    "3200102": { status: "ok", valor: 120 },
    "3200136": { status: "alerta", valor: 75 },
  }

  const getColor = (id: string) => {
    if (selected?.id === id) return "#111827" // selecionado (preto)

    if (!dados[id]) return "#E5E7EB"

    switch (dados[id].status) {
      case "ok":
        return "#22C55E"
      case "alerta":
        return "#F59E0B"
      case "erro":
        return "#EF4444"
      default:
        return "#E5E7EB"
    }
  }

  return (
    <div className="relative w-full">

      {/* 🗺️ MAPA */}
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 5000,
          center: [-40.5, -19.5]
        }}
        style={{ width: "100%", height: "auto" }}
      >
        {/* 🔍 Zoom + Pan */}
        <ZoomableGroup zoom={1}>
          <Geographies geography={geojson}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const id = geo.properties.id
                const name = geo.properties.name

                return (
                  <motion.g
                    key={geo.rsmKey}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Geography
                      geography={geo}
                      fill={getColor(id)}
                      stroke="#FFF"
                      strokeWidth={0.5}

                      onMouseEnter={(e) => {
                        setHovered({ id, name })
                      }}

                      onMouseLeave={() => {
                        setHovered(null)
                      }}

                      onClick={() => {
                        setSelected({ id, name })
                        console.log("Selecionado:", id, name)
                      }}

                      style={{
                        default: { outline: "none" },
                        hover: {
                          fill: "#3B82F6",
                          outline: "none"
                        },
                        pressed: {
                          fill: "#1D4ED8",
                          outline: "none"
                        }
                      }}
                    />
                  </motion.g>
                )
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* 💬 TOOLTIP */}
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

      {/* 📌 SELECIONADO */}
      {selected && (
        <div className="absolute top-4 right-4 bg-black text-white rounded-xl p-3">
          Selecionado: {selected.name}
        </div>
      )}
    </div>
  )
}