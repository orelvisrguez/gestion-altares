import React, { useState } from "react";
import { Altar } from "../types";
import {
  Shield,
  ShieldAlert,
  Crosshair,
  Users,
  MapPin,
  Swords,
  Maximize,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface MapVisualizationProps {
  altars: Altar[];
  onSelectAltar: (altar: Altar) => void;
}

const ALLIANCE_COLORS: Record<
  string,
  { bg: string; text: string; border: string; glow: string }
> = {
  LTS: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/30",
    glow: "shadow-blue-500/20",
  },
  UNR: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/30",
    glow: "shadow-red-500/20",
  },
  TDS: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    glow: "shadow-emerald-500/20",
  },
  LAT: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
    glow: "shadow-amber-500/20",
  },
  AGE: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/30",
    glow: "shadow-purple-500/20",
  },
  XPR: {
    bg: "bg-pink-500/10",
    text: "text-pink-400",
    border: "border-pink-500/30",
    glow: "shadow-pink-500/20",
  },
  RNV: {
    bg: "bg-teal-500/10",
    text: "text-teal-400",
    border: "border-teal-500/30",
    glow: "shadow-teal-500/20",
  },
  DESCONOCIDO: {
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    border: "border-slate-500/30",
    glow: "shadow-slate-500/20",
  },
};

export default function MapVisualization({
  altars,
  onSelectAltar,
}: MapVisualizationProps) {
  const [activeTab, setActiveTab] = useState<"threats" | "matrix" | "map">(
    "threats",
  );
  const now = new Date();

  // Helper to get alliance style
  const getStyle = (alliance: string) => {
    const key = alliance.toUpperCase().trim();
    return (
      ALLIANCE_COLORS[key] || {
        bg: "bg-slate-500/10",
        text: "text-slate-300",
        border: "border-slate-500/20",
        glow: "shadow-slate-500/10",
      }
    );
  };

  // Analyze each altar's threat profile
  const analyzedAltars = altars.map((altar) => {
    const isProtected = altar.protectionExpiresAt
      ? new Date(altar.protectionExpiresAt) > now
      : false;
    const currentOccupier = (altar.occupiedBy || "DESCONOCIDO")
      .toUpperCase()
      .trim();

    // Competitors are neighbors that are NOT the owner/occupier
    const threateningNeighbors = altar.neighbors
      .map((n) => n.toUpperCase().trim())
      .filter((n) => n !== currentOccupier && n !== "");

    // Unique threatening neighbors
    const uniqueThreats = Array.from(new Set(threateningNeighbors));

    // Threat level calculation:
    // If protected -> SAFE (No sudden attack possible)
    // If unprotected & heavily bordered by enemies -> HIGH
    // If unprotected & moderately bordered -> MEDIUM
    // Else LOW/NONE
    let threatLevel: "CRITICO" | "ALTO" | "MEDIO" | "SEGURO" = "SEGURO";
    if (!isProtected) {
      if (uniqueThreats.length >= 3) {
        threatLevel = "CRITICO";
      } else if (uniqueThreats.length >= 2) {
        threatLevel = "ALTO";
      } else if (uniqueThreats.length >= 1) {
        threatLevel = "MEDIO";
      }
    }

    return {
      ...altar,
      isProtected,
      uniqueThreats,
      threatLevel,
    };
  });

  return (
    <div className="bg-[#0c0c0e] border border-[#27272a] rounded-lg p-6 shadow-xl mb-8">
      {/* Tab bar header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#27272a] pb-4 mb-6">
        <div>
          <h2 className="text-md sm:text-lg font-serif font-semibold text-[#e2e2e8] tracking-widest uppercase flex items-center gap-2">
            <Swords className="w-5 h-5 text-gold-clan" /> PLANIFICADOR
            ESTRATÉGICO DE FRONTERAS
          </h2>
          <p className="text-xs text-[#71717a]">
            Analiza qué puestos de avanzada están vulnerables o rodeados por
            alianzas enemigas.
          </p>
        </div>

        <div className="flex bg-[#18181b] p-1 rounded border border-[#27272a]">
          <button
            onClick={() => setActiveTab("threats")}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-all cursor-pointer uppercase tracking-wider ${
              activeTab === "threats"
                ? "bg-gold-clan text-[#0c0c0e] font-bold"
                : "text-[#71717a] hover:text-white"
            }`}
          >
            Nivel de Amenaza
          </button>
          <button
            onClick={() => setActiveTab("matrix")}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-all cursor-pointer uppercase tracking-wider ${
              activeTab === "matrix"
                ? "bg-gold-clan text-[#0c0c0e] font-bold"
                : "text-[#71717a] hover:text-white"
            }`}
          >
            Matriz de Control
          </button>
          <button
            onClick={() => setActiveTab("map")}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-all cursor-pointer uppercase tracking-wider ${
              activeTab === "map"
                ? "bg-gold-clan text-[#0c0c0e] font-bold"
                : "text-[#71717a] hover:text-white"
            }`}
          >
            Mapa Táctico
          </button>
        </div>
      </div>

      {activeTab === "threats" ? (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Critical */}
            <div className="bg-[#111113] border border-red-500/20 p-4 rounded">
              <div className="flex items-center justify-between mb-3 border-b border-[#27272a] pb-2">
                <span className="text-[11px] font-bold text-red-500 font-mono flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  Riesgo Crítico
                </span>
                <span className="text-xs text-[#71717a] font-mono">
                  {
                    analyzedAltars.filter((a) => a.threatLevel === "CRITICO")
                      .length
                  }
                </span>
              </div>
              <div className="space-y-2">
                {analyzedAltars
                  .filter((a) => a.threatLevel === "CRITICO")
                  .map((a) => (
                    <div
                      key={a.id}
                      onClick={() => onSelectAltar(a)}
                      className="p-2.5 bg-[#18181b] border border-transparent hover:border-red-500/40 rounded cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div className="truncate pr-2">
                        <p className="text-xs font-serif font-medium text-[#f4f4f5] truncate">
                          {a.name}
                        </p>
                        <p className="text-[10px] text-[#71717a] font-mono">
                          Propietario: {a.occupiedBy}
                        </p>
                      </div>
                      <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                    </div>
                  ))}
                {analyzedAltars.filter((a) => a.threatLevel === "CRITICO")
                  .length === 0 && (
                  <div className="text-center py-6 text-xs text-[#71717a] italic font-mono">
                    Ninguno en riesgo crítico
                  </div>
                )}
              </div>
            </div>

            {/* High */}
            <div className="bg-[#111113] border border-orange-500/20 p-4 rounded">
              <div className="flex items-center justify-between mb-3 border-b border-[#27272a] pb-2">
                <span className="text-[11px] font-bold text-orange-400 font-mono flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                  Riesgo Alto
                </span>
                <span className="text-xs text-[#71717a] font-mono">
                  {
                    analyzedAltars.filter((a) => a.threatLevel === "ALTO")
                      .length
                  }
                </span>
              </div>
              <div className="space-y-2">
                {analyzedAltars
                  .filter((a) => a.threatLevel === "ALTO")
                  .map((a) => (
                    <div
                      key={a.id}
                      onClick={() => onSelectAltar(a)}
                      className="p-2.5 bg-[#18181b] border border-transparent hover:border-orange-500/40 rounded cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div className="truncate pr-2">
                        <p className="text-xs font-serif font-medium text-[#f4f4f5] truncate">
                          {a.name}
                        </p>
                        <p className="text-[10px] text-[#71717a] font-mono">
                          Propietario: {a.occupiedBy}
                        </p>
                      </div>
                      <ShieldAlert className="w-4 h-4 text-orange-400 shrink-0" />
                    </div>
                  ))}
                {analyzedAltars.filter((a) => a.threatLevel === "ALTO")
                  .length === 0 && (
                  <div className="text-center py-6 text-xs text-[#71717a] italic font-mono">
                    Ninguno en riesgo alto
                  </div>
                )}
              </div>
            </div>

            {/* Medium */}
            <div className="bg-[#111113] border border-yellow-500/20 p-4 rounded">
              <div className="flex items-center justify-between mb-3 border-b border-[#27272a] pb-2">
                <span className="text-[11px] font-bold text-yellow-550 text-gold-clan font-mono flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-gold-clan"></span>
                  Riesgo Medio
                </span>
                <span className="text-xs text-[#71717a] font-mono">
                  {
                    analyzedAltars.filter((a) => a.threatLevel === "MEDIO")
                      .length
                  }
                </span>
              </div>
              <div className="space-y-2">
                {analyzedAltars
                  .filter((a) => a.threatLevel === "MEDIO")
                  .map((a) => (
                    <div
                      key={a.id}
                      onClick={() => onSelectAltar(a)}
                      className="p-2.5 bg-[#18181b] border border-transparent hover:border-gold-clan/40 rounded cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div className="truncate pr-2">
                        <p className="text-xs font-serif font-medium text-[#f4f4f5] truncate">
                          {a.name}
                        </p>
                        <p className="text-[10px] text-[#71717a] font-mono">
                          Propietario: {a.occupiedBy}
                        </p>
                      </div>
                      <Crosshair className="w-4 h-4 text-gold-clan shrink-0" />
                    </div>
                  ))}
                {analyzedAltars.filter((a) => a.threatLevel === "MEDIO")
                  .length === 0 && (
                  <div className="text-center py-6 text-xs text-[#71717a] italic font-mono">
                    Ninguno en riesgo medio
                  </div>
                )}
              </div>
            </div>

            {/* Safe */}
            <div className="bg-[#111113] border border-emerald-500/20 p-4 rounded">
              <div className="flex items-center justify-between mb-3 border-b border-[#27272a] pb-2">
                <span className="text-[11px] font-bold text-emerald-500 font-mono flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Zonas Seguras
                </span>
                <span className="text-xs text-[#71717a] font-mono">
                  {
                    analyzedAltars.filter((a) => a.threatLevel === "SEGURO")
                      .length
                  }
                </span>
              </div>
              <div className="space-y-2">
                {analyzedAltars
                  .filter((a) => a.threatLevel === "SEGURO")
                  .map((a) => (
                    <div
                      key={a.id}
                      onClick={() => onSelectAltar(a)}
                      className="p-2.5 bg-[#18181b] border border-transparent hover:border-emerald-500/40 rounded cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div className="truncate pr-2">
                        <p className="text-xs font-serif font-medium text-[#f4f4f5] truncate">
                          {a.name}
                        </p>
                        <p className="text-[10px] text-[#71717a] font-mono">
                          Propietario: {a.occupiedBy}
                        </p>
                      </div>
                      <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                    </div>
                  ))}
                {analyzedAltars.filter((a) => a.threatLevel === "SEGURO")
                  .length === 0 && (
                  <div className="text-center py-6 text-xs text-[#71717a] italic font-mono">
                    Ninguno catalogado seguro
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === "matrix" ? (
        /* Matrix Grid */
        <div className="overflow-x-auto border border-[#27272a] rounded">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#111113] border-b border-[#27272a] text-[#71717a] uppercase tracking-wider font-mono">
                <th className="py-3 px-4">Altar (Puesto Avanzado)</th>
                <th className="py-3 px-4">Ocupado Por</th>
                <th className="py-3 px-4">Mis Vecinos (Frontera)</th>
                <th className="py-3 px-4">Amenazas de Pérdida</th>
                <th className="py-3 px-4">Estado de Escudo</th>
              </tr>
            </thead>
            <tbody>
              {analyzedAltars.map((a) => {
                const style = getStyle(a.occupiedBy);

                return (
                  <tr
                    key={a.id}
                    onClick={() => onSelectAltar(a)}
                    className="border-b border-[#27272a]/70 hover:bg-[#18181b]/50 cursor-pointer transition-all"
                  >
                    <td className="py-3.5 px-4 font-serif font-semibold text-[#f4f4f5] flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gold-clan" />
                      <div>
                        <div>{a.name}</div>
                        <div className="text-[10px] text-[#71717a] font-sans font-normal">
                          {a.effect}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${style.bg} ${style.text} border ${style.border}`}
                      >
                        {a.occupiedBy}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#d4d4d8]">
                      <div className="flex flex-wrap gap-1">
                        {a.neighbors.map((n, idx) => {
                          const nStyle = getStyle(n);
                          return (
                            <span
                              key={idx}
                              className={`px-1 rounded text-[10px] border ${n === a.occupiedBy ? "bg-[#18181b]/80 text-[#71717a] border-[#27272a]" : `${nStyle.bg} ${nStyle.text} ${nStyle.border}`}`}
                            >
                              {n}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {a.uniqueThreats.length > 0 ? (
                        <div className="flex items-center gap-1 text-orange-400 font-mono">
                          <Users className="w-3.5 h-3.5" />
                          <span>{a.uniqueThreats.join(", ")}</span>
                        </div>
                      ) : (
                        <span className="text-[#71717a] italic font-mono text-[11px]">
                          Ninguno
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {a.isProtected ? (
                        <span className="text-emerald-500 flex items-center gap-1 font-mono text-[10px] font-bold">
                          <Shield className="w-3.5 h-3.5 shrink-0" /> PROTEGIDO
                        </span>
                      ) : (
                        <span className="text-rose-500 flex items-center gap-1 font-mono text-[10px] font-bold">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />{" "}
                          VULNERABLE
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : activeTab === "map" ? (
        <div className="relative w-full h-[500px] border border-[#27272a] rounded-lg bg-[#08080a] overflow-hidden group">
          {/* Axis indicators */}
          <div className="absolute top-2 left-2 flex gap-2 z-20">
            <div className="bg-[#111113] border border-[#27272a] rounded px-2 py-1 text-[10px] font-mono text-[#71717a]">
              Y
            </div>
            <div className="bg-[#111113] border border-[#27272a] rounded px-2 py-1 text-[10px] font-mono text-[#71717a]">
              X
            </div>
          </div>

          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={4}
            centerOnInit={true}
            wheel={{ step: 0.1 }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                <div className="absolute top-2 right-2 flex gap-1.5 z-20">
                  <button onClick={() => zoomIn()} className="bg-[#111113] hover:bg-[#18181b] border border-[#27272a] rounded p-1.5 text-[#a1a1aa] hover:text-white transition-colors cursor-pointer">
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button onClick={() => zoomOut()} className="bg-[#111113] hover:bg-[#18181b] border border-[#27272a] rounded p-1.5 text-[#a1a1aa] hover:text-white transition-colors cursor-pointer">
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button onClick={() => resetTransform()} className="bg-[#111113] hover:bg-[#18181b] border border-[#27272a] rounded p-1.5 text-[#a1a1aa] hover:text-white transition-colors cursor-pointer">
                    <Maximize className="w-4 h-4" />
                  </button>
                </div>

                <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                  <div className="relative w-[1200px] h-[1200px] bg-[#08080a]">
                    {/* Grid background */}
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage:
                          "linear-gradient(#27272a 1px, transparent 1px), linear-gradient(90deg, #27272a 1px, transparent 1px)",
                        backgroundSize: "20px 20px",
                        backgroundPosition: "center center",
                        opacity: 0.2,
                      }}
                    ></div>
              {analyzedAltars.map((a) => {
                if (a.x === undefined || a.y === undefined) return null;
                const style = getStyle(a.occupiedBy);

                // Map the theoretical coordinate space to this canvas (scaling might adjust)
                // Let's assume standard maps are around 0-1200 for Y and X, arbitrary positioning
                // Scaling by simple 1:1 if it fits inside 1200x1200
                const leftPos = Math.max(0, Math.min(1150, a.x));
                const topPos = Math.max(0, Math.min(1150, a.y));

                return (
                  <div
                    key={a.id}
                    onClick={() => onSelectAltar(a)}
                    className={`absolute flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded border ${style.bg} ${style.border} cursor-pointer pointer-events-auto hover:scale-125 transition-transform z-10 group/node`}
                    style={{ left: `${leftPos}px`, top: `${topPos}px` }}
                    title={a.name}
                  >
                    <div
                      className={`w-3 h-3 rotate-45 ${a.isProtected ? "bg-emerald-500" : "bg-red-500"} ${style.glow}`}
                    ></div>

                    {/* Tooltip / Label */}
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[#111113] border border-[#27272a] px-2 py-1 rounded text-center opacity-0 group-hover/node:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-20">
                      <p className="text-[10px] font-bold text-[#e4e4e7]">
                        {a.name}
                      </p>
                      <p className="text-[9px] font-mono text-[#a1a1aa]">
                        {a.occupiedBy} • ({a.x}, {a.y})
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Lines bridging neighbors */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30 z-0 text-[#27272a]">
                {analyzedAltars.map((a) => {
                  if (a.x === undefined || a.y === undefined) return null;

                  return a.neighbors.map((nName) => {
                    // Find neighbor by owner/alliance
                    // Note: 'neighbors' in the data structure appears to be strings of alliance names (e.g. LTS, UNR).
                    // This implies neighbors are specific alliances, but maybe we can link altars bounded by those.
                    // To actually draw edges, we'd need altar-to-altar links.
                    // Let's skip drawing edges unless we have actual graph ties (altar ID to altar ID).
                    return null;
                  });
                })}
              </svg>
                  </div>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>

          <div className="absolute bottom-4 right-4 bg-[#111113] border border-[#27272a] p-3 rounded-lg flex flex-col gap-2 shadow-lg z-20">
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#a1a1aa]">
              <div className="w-2 h-2 rotate-45 bg-emerald-500"></div> Protegido
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#a1a1aa]">
              <div className="w-2 h-2 rotate-45 bg-red-500"></div> Vulnerable
            </div>
          </div>

          {analyzedAltars.every(
            (a) => a.x === undefined || a.y === undefined,
          ) && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#08080a]/50 pointer-events-none text-center">
              <div>
                <MapPin className="w-8 h-8 text-[#3f3f46] mx-auto mb-2" />
                <p className="text-[#a1a1aa] font-mono text-xs max-w-xs">
                  Aún no hay altares con coordenadas.
                  <br />
                  Edite los altares para establecer sus ubicaciones X e Y en el
                  mapa.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
