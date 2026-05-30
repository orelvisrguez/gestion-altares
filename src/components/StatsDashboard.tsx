import React from "react";
import { Altar } from "../types";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Shield, ShieldAlert, Award, Castle, CheckCircle2 } from "lucide-react";

interface StatsDashboardProps {
  altars: Altar[];
  onSelectAlliance: (alliance: string | null) => void;
  selectedAlliance: string | null;
}

const ALLIANCE_COLORS: Record<string, string> = {
  LTS: "#b48c3e", // Gold standard matching the theme!
  UNR: "#ef4444", 
  TDS: "#10b981", 
  LAT: "#cbd5e1", 
  AGE: "#8b5cf6", 
  XPR: "#ec4899", 
  RNV: "#14b8a6", 
  DESCONOCIDO: "#71717a" 
};

export default function StatsDashboard({ altars, onSelectAlliance, selectedAlliance }: StatsDashboardProps) {
  const now = new Date();

  // 1. Calculate General Numbers
  const totalCount = altars.length;
  const protectedCount = altars.filter(a => {
    if (!a.protectionExpiresAt) return false;
    return new Date(a.protectionExpiresAt) > now;
  }).length;
  const vulnerableCount = totalCount - protectedCount;

  // 2. Aggregate counts and buffs by alliance
  const allianceStatsMap: Record<string, { count: number; bonuses: string[] }> = {};

  altars.forEach(altar => {
    const occ = altar.occupiedBy ? altar.occupiedBy.toUpperCase().trim() : "DESCONOCIDO";
    if (!allianceStatsMap[occ]) {
      allianceStatsMap[occ] = { count: 0, bonuses: [] };
    }
    allianceStatsMap[occ].count += 1;
    if (altar.effect) {
      allianceStatsMap[occ].bonuses.push(`${altar.name.replace(/\sNivel\s\d+/i, "")}: ${altar.effect}`);
    }
  });

  // Convert to array for Recharts & UI rendering
  const chartData = Object.entries(allianceStatsMap).map(([alliance, data]) => {
    return {
      name: alliance,
      cantidad: data.count,
      color: ALLIANCE_COLORS[alliance] || `#adc6ff`
    };
  }).sort((a, b) => b.cantidad - a.cantidad);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Col 1: Counters (Bento box style) */}
      <div className="bg-[#0c0c0e] border border-[#27272a] rounded-lg p-5 flex flex-col justify-between shadow-xl">
        <div>
          <h3 className="text-xs font-serif font-semibold text-[#e2e2e8] uppercase tracking-widest mb-4 flex items-center gap-1.5">
            <Castle className="w-4 h-4 text-gold-clan" /> RESUMEN DE CONTROL
          </h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-[#18181b] p-3 rounded border border-[#3f3f46] text-center">
              <span className="block text-2xl font-bold text-[#f4f4f5] font-mono">{totalCount}</span>
              <span className="text-[10px] text-[#71717a] font-medium block">Total Altares</span>
            </div>
            <div className="bg-green-950/20 p-3 rounded border border-green-900/30 text-center">
              <span className="block text-2xl font-bold text-green-500 font-mono flex items-center justify-center gap-1">
                {protectedCount}
              </span>
              <span className="text-[10px] text-green-400 font-medium block">Protegidos</span>
            </div>
            <div className="bg-rose-950/20 p-3 rounded border border-rose-900/35 text-center">
              <span className="block text-2xl font-bold text-rose-500 font-mono">
                {vulnerableCount}
              </span>
              <span className="text-[10px] text-rose-400 font-medium block">Vulnerables</span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-[#27272a] text-xs text-[#71717a] space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Los altares protegidos por escudo no pueden ser atacados ni ocupados.</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>Los altares vulnerables se encuentran descubiertos y listos para conquista.</span>
          </div>
        </div>
      </div>

      {/* Col 2: Recharts Bar Chart of Occupancy */}
      <div className="bg-[#0c0c0e] border border-[#27272a] rounded-lg p-5 shadow-xl flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-serif font-semibold text-[#e2e2e8] uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-gold-clan" /> ALTARES POR ALIANZA
          </h3>
          <p className="text-[10px] text-[#71717a] pb-2 uppercase tracking-wider font-mono">Haz clic en una barra para filtrar resultados</p>
        </div>

        <div className="h-32 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: "#a8a29e", fontSize: 10, fontFamily: "monospace" }} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  allowDecimals={false} 
                  tick={{ fill: "#a8a29e", fontSize: 10, fontFamily: "monospace" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                  contentStyle={{
                    backgroundColor: "#0c0c0e",
                    borderColor: "#3f3f46",
                    borderRadius: "4px",
                    color: "#d4d4d8",
                    fontSize: "11px",
                    fontFamily: "monospace"
                  }}
                />
                <Bar 
                  dataKey="cantidad" 
                  radius={[2, 2, 0, 0]} 
                  onClick={(data) => {
                    if (data && data.name) {
                      if (selectedAlliance === data.name) {
                        onSelectAlliance(null);
                      } else {
                        onSelectAlliance(data.name);
                      }
                    }
                  }}
                  className="cursor-pointer"
                >
                  {chartData.map((entry, index) => {
                    const isSelected = selectedAlliance === entry.name;
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        opacity={selectedAlliance ? (isSelected ? 1.0 : 0.3) : 0.9}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-[#71717a] text-xs font-mono">
              Sin datos disponibles
            </div>
          )}
        </div>

        {selectedAlliance && (
          <div className="mt-2 text-center">
            <button
              onClick={() => onSelectAlliance(null)}
              className="text-[10px] text-[#b48c3e] hover:text-[#967432] underline font-mono cursor-pointer"
            >
              Mostrar todas las alianzas (Filtro: {selectedAlliance})
            </button>
          </div>
        )}
      </div>

      {/* Col 3: Active Buffs Breakdown */}
      <div className="bg-[#0c0c0e] border border-[#27272a] rounded-lg p-5 shadow-xl flex flex-col justify-between max-h-[220px] overflow-y-auto custom-scrollbar">
        <h3 className="text-xs font-serif font-semibold text-[#e2e2e8] uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-[#27272a] pb-2">
          <CheckCircle2 className="w-4 h-4 text-gold-clan" /> EFECTOS ACTIVOS DE ALIANZA
        </h3>
        <div className="space-y-4 flex-1">
          {Object.entries(allianceStatsMap)
            .filter(([alliance]) => !selectedAlliance || alliance === selectedAlliance)
            .map(([alliance, data]) => {
              const color = ALLIANCE_COLORS[alliance] || "#cbd5e1";
              return (
                <div key={alliance} className="bg-[#18181b]/50 p-2.5 rounded border border-[#27272a]/60">
                  <div className="flex items-center justify-between mb-1.5">
                    <span 
                      className="px-2 py-0.5 rounded text-[10px] font-bold text-[#0c0c0e] font-mono uppercase"
                      style={{ backgroundColor: color }}
                    >
                      {alliance}
                    </span>
                    <span className="text-[10px] text-[#a8a29e] font-mono">
                      {data.count} {data.count === 1 ? "altar" : "altares"}
                    </span>
                  </div>
                  {data.bonuses.length > 0 ? (
                    <ul className="text-[11px] text-[#a8a29e] space-y-1 pl-4 list-disc font-sans leading-relaxed">
                      {data.bonuses.map((bonus, key) => (
                        <li key={key} className="hover:text-[#e4e4e7] transition-colors">{bonus}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-[10px] text-[#71717a] italic">No otorga bonificadores</span>
                  )}
                </div>
              );
            })}
          {Object.keys(allianceStatsMap).length === 0 && (
            <div className="text-center text-[#71717a] text-xs italic py-4">
              Ningún altar ocupado aún
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
