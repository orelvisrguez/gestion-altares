import React, { useState, useEffect } from "react";
import { Altar } from "../types";
import { formatRemainingTime } from "../utils/parser";
import { Shield, ShieldAlert, Edit, Trash2, Zap, ArrowRight, UserCheck, RefreshCcw, Landmark } from "lucide-react";

interface AltarCardProps {
  altar: Altar;
  onEdit: (altar: Altar) => void;
  onDelete: (id: string) => void;
  onQuickChangeOccupant: (id: string, newOccupant: string) => void;
  onRefreshProtection: (id: string) => void;
}

const ALLIANCE_COLORS: Record<string, { bg: string; text: string; border: string; bgSoft: string }> = {
  LTS: { bg: "bg-blue-500", text: "text-blue-400", border: "border-blue-500/35", bgSoft: "bg-blue-950/30" },
  UNR: { bg: "bg-red-500", text: "text-red-400", border: "border-red-500/35", bgSoft: "bg-red-950/30" },
  TDS: { bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/35", bgSoft: "bg-emerald-950/30" },
  LAT: { bg: "bg-amber-500", text: "text-amber-400", border: "border-amber-500/35", bgSoft: "bg-amber-950/30" },
  AGE: { bg: "bg-purple-500", text: "text-purple-400", border: "border-purple-500/35", bgSoft: "bg-purple-950/30" },
  XPR: { bg: "bg-pink-500", text: "text-pink-400", border: "border-pink-500/35", bgSoft: "bg-pink-950/30" },
  RNV: { bg: "bg-teal-500", text: "text-teal-400", border: "border-teal-500/35", bgSoft: "bg-teal-950/30" },
  DESCONOCIDO: { bg: "bg-slate-500", text: "text-slate-400", border: "border-slate-500/35", bgSoft: "bg-slate-900/30" }
};

export default function AltarCard({
  altar,
  onEdit,
  onDelete,
  onQuickChangeOccupant,
  onRefreshProtection
}: AltarCardProps) {
  const [remainingMs, setRemainingMs] = useState<number>(0);
  const [showQuickOwnerMenu, setShowQuickOwnerMenu] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      if (!altar.protectionExpiresAt) {
        setRemainingMs(0);
        return;
      }
      const diffStr = new Date(altar.protectionExpiresAt).getTime() - Date.now();
      setRemainingMs(diffStr > 0 ? diffStr : 0);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [altar.protectionExpiresAt]);

  const isProtected = remainingMs > 0;
  const occupierColor = ALLIANCE_COLORS[altar.occupiedBy.toUpperCase().trim()] || ALLIANCE_COLORS.DESCONOCIDO;

  // Key Alliances for the quick swap feature
  const QUICK_ALLIANCES = ["LTS", "UNR", "TDS", "LAT", "AGE"];

  return (
    <div className={`relative bg-[#111113] border ${isProtected ? "border-[#27272a] hover:border-gold-clan" : "border-[#27272a] hover:border-rose-500/40"} rounded-lg p-5 flex flex-col justify-between shadow-xl transition-all hover:-translate-y-0.5`}>
      {/* Background visual water mark */}
      <div className="absolute top-2 right-2 opacity-[0.03] select-none pointer-events-none">
        <Landmark className="w-24 h-24 text-white" />
      </div>

      {/* Header */}
      <div className="relative">
        <div className="flex items-start justify-between mb-2 gap-2">
          {/* Altar Badge Level */}
          <span className="bg-[#18181b] border border-[#3f3f46] text-[9px] font-mono text-gold-clan px-2 py-0.5 rounded font-bold shrink-0 uppercase tracking-widest">
            NIVEL {altar.level}
          </span>

          {/* Protection pill with timer */}
          {isProtected ? (
            <span className="bg-green-950/20 text-green-500 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded flex items-center gap-1">
              <Shield className="w-3 h-3 text-green-500 shrink-0" />
              {formatRemainingTime(remainingMs)}
            </span>
          ) : (
            <span className="bg-rose-950/20 text-rose-500 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-rose-500 shrink-0" />
              VULNERABLE
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className="text-lg font-serif font-medium text-[#f4f4f5] tracking-wide line-clamp-1 mb-2">
          {altar.name}
        </h4>

        {/* Buff/Effect Description */}
        <div className="bg-[#18181b]/50 p-2.5 rounded border border-[#27272a]/60 mb-3.5 min-h-[44px]">
          <p className="text-[11px] text-[#d4d4d8] font-medium flex items-center gap-1.5 leading-snug">
            <Zap className="w-3.5 h-3.5 text-gold-clan shrink-0" />
            {altar.effect || "Sin efecto registrado"}
          </p>
        </div>

        {/* Owner Details */}
        <div className="flex items-center justify-between py-2 border-b border-[#27272a] text-xs">
          <span className="text-[#71717a] font-mono">Ocupado por:</span>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${occupierColor.bgSoft} ${occupierColor.text} border ${occupierColor.border}`}>
              {altar.occupiedBy || "NINGUNO"}
            </span>
            <button
              onClick={() => setShowQuickOwnerMenu(!showQuickOwnerMenu)}
              title="Cambiar Ocupante Rápido"
              className="p-1 hover:bg-[#18181b] text-[#71717a] hover:text-white rounded transition-colors cursor-pointer border border-transparent hover:border-[#3f3f46]"
            >
              <UserCheck className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Owner Switch Panel */}
        {showQuickOwnerMenu && (
          <div className="bg-[#0c0c0e]/95 p-2 rounded border border-[#3f3f46] my-2 flex flex-wrap gap-1 items-center justify-center">
            <span className="text-[9px] font-mono text-[#71717a] w-full text-center pb-0.5 uppercase tracking-wider">Cambiar ocupante:</span>
            {QUICK_ALLIANCES.map(alliance => (
              <button
                key={alliance}
                onClick={() => {
                  onQuickChangeOccupant(altar.id, alliance);
                  setShowQuickOwnerMenu(false);
                }}
                className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded cursor-pointer transition-colors hover:bg-[#27272a] ${
                  altar.occupiedBy.toUpperCase().trim() === alliance
                    ? "bg-[#18181b] text-gold-clan border border-gold-clan/30"
                    : "text-[#71717a]"
                }`}
              >
                {alliance}
              </button>
            ))}
            <button
              onClick={() => {
                const manual = prompt("Escriba la etiqueta de la alianza (Ej: LTS, UNR):");
                if (manual) {
                  onQuickChangeOccupant(altar.id, manual.toUpperCase().trim());
                }
                setShowQuickOwnerMenu(false);
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded text-[#71717a] hover:text-[#e4e4e7] hover:bg-[#27272a]"
            >
              Otro...
            </button>
          </div>
        )}

        {/* Map Neighbors */}
        <div className="py-2 pb-4 text-xs">
          <div className="flex items-center justify-between text-[#71717a] mb-1.5 font-mono">
            <span>Frontera d/ Vecinos:</span>
            <span className="text-[10px] text-[#71717a]/80">{altar.neighbors.length} aliados/rivales</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {altar.neighbors.map((neighbor, index) => {
              const formattedNeighbor = neighbor.toUpperCase().trim();
              const isOccupier = formattedNeighbor === altar.occupiedBy.toUpperCase().trim();
              const nColor = ALLIANCE_COLORS[formattedNeighbor] || ALLIANCE_COLORS.DESCONOCIDO;

              return (
                <span
                  key={index}
                  className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-mono border ${
                    isOccupier
                      ? "bg-[#18181b] text-[#71717a] border-[#27272a]"
                      : `${nColor.bgSoft} ${nColor.text} ${nColor.border}`
                  }`}
                  title={isOccupier ? `${formattedNeighbor} es el ocupante actual` : `Vecino bordering: ${formattedNeighbor}`}
                >
                  {formattedNeighbor}
                </span>
              );
            })}
            {altar.neighbors.length === 0 && (
              <span className="text-[10px] text-[#71717a] font-mono italic">Sin vecinos frontera</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Tools Actions */}
      <div className="pt-3 border-t border-[#27272a] flex items-center justify-between gap-1 text-[#71717a] text-xs">
        <button
          onClick={() => onRefreshProtection(altar.id)}
          className="hover:text-gold-clan p-1.5 rounded hover:bg-[#18181b] font-mono text-[10px] flex items-center gap-1 cursor-pointer transition-colors border border-transparent hover:border-[#27272a]"
          title={`Reiniciar escudo por ${altar.protectionTimeInput || "1h"}`}
        >
          <RefreshCcw className="w-3.5 h-3.5 text-gold-clan" />
          <span>Escudo {altar.protectionTimeInput ? `(${altar.protectionTimeInput})` : ""}</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(altar)}
            title="Editar Altar"
            className="p-1.5 hover:bg-[#18181b] text-[#71717a] hover:text-gold-clan rounded transition-colors cursor-pointer border border-transparent hover:border-[#27272a]"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(altar.id)}
            title="Eliminar Altar"
            className="p-1.5 hover:bg-rose-950/20 text-[#71717a] hover:text-rose-500 rounded transition-colors cursor-pointer border border-transparent hover:border-rose-950/20"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
