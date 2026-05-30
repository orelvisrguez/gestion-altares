import React, { useState, useEffect } from "react";
import { Altar } from "../types";
import { parseRelativeTimeToMs } from "../utils/parser";
import { Save, HelpCircle, X, Plus, AlertCircle } from "lucide-react";

interface AltarFormProps {
  altar?: Altar | null; // If provided, we are editing
  onSave: (altarData: Omit<Altar, "id" | "createdAt" | "updatedAt"> & { id?: string }) => void;
  onClose: () => void;
}

export default function AltarForm({ altar, onSave, onClose }: AltarFormProps) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState(1);
  const [effect, setEffect] = useState("");
  const [neighborsInput, setNeighborsInput] = useState("");
  const [occupiedBy, setOccupiedBy] = useState("");
  const [protectionTimeInput, setProtectionTimeInput] = useState("");
  const [notes, setNotes] = useState("");
  const [xPos, setXPos] = useState<number | "">("");
  const [yPos, setYPos] = useState<number | "">("");

  const [parseIndicator, setParseIndicator] = useState<{ success: boolean; msg: string } | null>(null);

  // Populates data on Edit Mode
  useEffect(() => {
    if (altar) {
      setName(altar.name.replace(/\sNivel\s\d+/i, "")); // strip level suffix for clean editing
      setLevel(altar.level || 1);
      setEffect(altar.effect || "");
      setNeighborsInput(altar.neighbors ? altar.neighbors.join(", ") : "");
      setOccupiedBy(altar.occupiedBy || "");
      setProtectionTimeInput(altar.protectionTimeInput || "");
      setNotes(altar.notes || "");
      setXPos(altar.x !== undefined ? altar.x : "");
      setYPos(altar.y !== undefined ? altar.y : "");
    } else {
      // Create presets
      setName("");
      setLevel(1);
      setEffect("");
      setNeighborsInput("");
      setOccupiedBy("");
      setProtectionTimeInput("");
      setNotes("");
      setXPos("");
      setYPos("");
    }
  }, [altar]);

  // Real-time parsed protective feed-backs
  useEffect(() => {
    if (!protectionTimeInput.trim()) {
      setParseIndicator(null);
      return;
    }
    const ms = parseRelativeTimeToMs(protectionTimeInput);
    if (ms !== null) {
      const minutes = Math.floor((ms / 60000) % 60);
      const hours = Math.floor((ms / 3600000) % 24);
      const days = Math.floor(ms / 86400000);
      setParseIndicator({
        success: true,
        msg: `Válido: ${days > 0 ? `${days}d ` : ""}${hours.toString().padStart(2, "0")}h y ${minutes.toString().padStart(2, "0")}m de escudo.`
      });
    } else {
      setParseIndicator({
        success: false,
        msg: "Formato no reconocido. Usa ej.: '1d 03:50 H' o '10:29 H' o '2d'."
      });
    }
  }, [protectionTimeInput]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    // Split neighbors by commas or whitespace
    const neighbors = neighborsInput
      .split(/[\s,;\-]+/)
      .map(tag => tag.trim().toUpperCase())
      .filter(tag => tag.length > 0);

    // Save
    onSave({
      id: altar?.id, // include ID if editing
      name: `${name.trim()} Nivel ${level}`,
      level,
      effect: effect.trim(),
      neighbors,
      occupiedBy: (occupiedBy.trim() || "DESCONOCIDO").toUpperCase(),
      protectionTimeInput: protectionTimeInput.trim(),
      protectionExpiresAt: altar ? altar.protectionExpiresAt : null, // parent app will recal if needed
      notes: notes.trim(),
      x: xPos !== "" ? Number(xPos) : undefined,
      y: yPos !== "" ? Number(yPos) : undefined
    });

    onClose();
  };

  // Quick Durations helpers
  const applyPresetTime = (preset: string) => {
    setProtectionTimeInput(preset);
  };

  return (
    <div className="fixed inset-0 bg-[#08080a]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0c0c0e]/85 backdrop-blur-2xl border border-[#27272a]/70 rounded-xl w-full max-w-lg flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_15px_rgba(180,140,62,0.1)] animate-fade-in text-[#e4e4e7]">
        
        {/* Header */}
        <div className="p-5 border-b border-[#27272a] flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-serif font-semibold uppercase tracking-widest text-gold-clan">
            {altar ? "📝 Editar Altar / Puesto de Avanzada" : "➕ Crear Nuevo Altar / Puesto de Avanzada"}
          </h3>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-[#71717a] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh] custom-scrollbar">
          {/* Altar Name */}
          <div>
            <label className="text-[10px] font-mono font-bold text-[#71717a] uppercase tracking-widest block mb-1.5">
              Nombre de Altar *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Gremio de Constructores (sin nivel)"
              className="w-full bg-[#18181b] border border-[#27272a] focus:border-gold-clan rounded px-3 py-2 text-xs font-mono text-[#f4f4f5] outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Coordinates */}
            <div>
              <label className="text-[10px] font-mono font-bold text-[#71717a] uppercase tracking-widest block mb-1.5">
                Coordenada X del Mapa
              </label>
              <input
                type="number"
                value={xPos}
                onChange={(e) => setXPos(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Ej. 520"
                className="w-full bg-[#18181b] border border-[#27272a] focus:border-gold-clan rounded px-3 py-2 text-xs font-mono text-[#f4f4f5] uppercase outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold text-[#71717a] uppercase tracking-widest block mb-1.5">
                Coordenada Y del Mapa
              </label>
              <input
                type="number"
                value={yPos}
                onChange={(e) => setYPos(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Ej. 1100"
                className="w-full bg-[#18181b] border border-[#27272a] focus:border-gold-clan rounded px-3 py-2 text-xs font-mono text-[#f4f4f5] uppercase outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Level */}
            <div>
              <label className="text-[10px] font-mono font-bold text-[#71717a] uppercase tracking-widest block mb-1.5">
                Nivel de Altar
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(parseInt(e.target.value, 10))}
                className="w-full bg-[#18181b] border border-[#27272a] focus:border-gold-clan rounded px-3 py-2 text-xs font-mono text-[#f4f4f5] outline-none transition-all"
              >
                {[1, 2, 3, 4, 5].map(lvl => (
                  <option key={lvl} value={lvl}>Nivel {lvl}</option>
                ))}
              </select>
            </div>

            {/* Occupant Alliance */}
            <div>
              <label className="text-[10px] font-mono font-bold text-[#71717a] uppercase tracking-widest block mb-1.5">
                Ocupado por (Alianza)
              </label>
              <input
                type="text"
                value={occupiedBy}
                onChange={(e) => setOccupiedBy(e.target.value)}
                placeholder="Ej. LTS, UNR"
                className="w-full bg-[#18181b] border border-[#27272a] focus:border-gold-clan rounded px-3 py-2 text-xs font-mono text-[#f4f4f5] uppercase outline-none transition-all"
              />
            </div>
          </div>

          {/* Buff / Passive Effect */}
          <div>
            <label className="text-[10px] font-mono font-bold text-[#71717a] uppercase tracking-widest block mb-1.5">
              Efecto o Bonificación (*opcional)
            </label>
            <input
              type="text"
              value={effect}
              onChange={(e) => setEffect(e.target.value)}
              placeholder="Ej: Velocidad de Construcción +5.0% o Ataque +5.0%"
              className="w-full bg-[#18181b] border border-[#27272a] focus:border-gold-clan rounded px-3 py-2 text-xs font-mono text-[#f4f4f5] outline-none transition-all"
            />
          </div>

          {/* Neighbors Borders list */}
          <div>
            <label className="text-[10px] font-mono font-bold text-[#71717a] uppercase tracking-widest block mb-1">
              Alianzas de Vecinos (Frontera)
            </label>
            <span className="text-[10px] text-[#71717a]/80 block mb-1.5 leading-snug">
              Separados por comas o espacios. Los rivales que bordean este altar.
            </span>
            <input
              type="text"
              value={neighborsInput}
              onChange={(e) => setNeighborsInput(e.target.value)}
              placeholder="Ej: UNR, LTS, LAT"
              className="w-full bg-[#18181b] border border-[#27272a] focus:border-gold-clan rounded px-3 py-2 text-xs font-mono text-[#f4f4f5] uppercase outline-none transition-all"
            />
          </div>

          {/* Protection Duration text */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-mono font-bold text-[#71717a] uppercase tracking-widest block">
                Tiempo de Protección (Duración)
              </label>
              <div className="flex items-center gap-1 text-[10px] text-[#71717a]">
                <HelpCircle className="w-3 h-3 text-[#71717a] shrink-0" />
                <span>Formato relativo de tiempo</span>
              </div>
            </div>

            <input
              type="text"
              value={protectionTimeInput}
              onChange={(e) => setProtectionTimeInput(e.target.value)}
              placeholder="Ej. '1d 03:50 H' o '10:29 H' o '02:00'"
              className="w-full bg-[#18181b] border border-[#27272a] focus:border-gold-clan rounded px-3 py-2 text-xs font-mono text-[#f4f4f5] outline-none transition-all"
            />

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              <button
                type="button"
                onClick={() => applyPresetTime("1d 03:50 H")}
                className="bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] px-1.5 py-0.5 rounded text-[10px] font-mono text-[#a8a29e] cursor-pointer transition-colors"
               >
                1d 3h 50m
              </button>
              <button
                type="button"
                onClick={() => applyPresetTime("2d 03:52 HORAS")}
                className="bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] px-1.5 py-0.5 rounded text-[10px] font-mono text-[#a8a29e] cursor-pointer transition-colors"
              >
                2d 3h 52m
              </button>
              <button
                type="button"
                onClick={() => applyPresetTime("10:29 HORAS")}
                className="bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] px-1.5 py-0.5 rounded text-[10px] font-mono text-[#a8a29e] cursor-pointer transition-colors"
              >
                10h 29m
              </button>
              <button
                type="button"
                onClick={() => applyPresetTime("01:06 HORAS")}
                className="bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] px-1.5 py-0.5 rounded text-[10px] font-mono text-[#a8a29e] cursor-pointer transition-colors"
              >
                1h 6m
              </button>
              <button
                type="button"
                onClick={() => applyPresetTime("")}
                className="bg-[#18181b] hover:bg-rose-950/20 text-rose-500 border border-rose-900/30 px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors"
              >
                Inactivo
              </button>
            </div>

            {/* Relative parsing indicator */}
            {parseIndicator && (
              <div className={`mt-2 flex items-center gap-1.5 text-[10px] font-mono ${parseIndicator.success ? "text-green-500" : "text-amber-500"}`}>
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{parseIndicator.msg}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] font-mono font-bold text-[#71717a] uppercase tracking-widest block mb-1.5">
              Notas Adicionales
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Proteger a toda costa, priorizar defensa remota."
              rows={2}
              className="w-full bg-[#18181b] border border-[#27272a] focus:border-gold-clan rounded p-3 text-xs font-mono text-[#f4f4f5] outline-none transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 pt-4 border-t border-[#27272a]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#18181b] hover:bg-[#27272a] text-[#a8a29e] border border-[#27272a] py-2 rounded text-xs font-semibold font-mono tracking-wide transition-all uppercase cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-gold-clan hover:bg-[#967432] text-[#0c0c0e] py-2 rounded text-xs font-bold font-mono tracking-wide uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-gold-clan/10 transition-all"
            >
              <Save className="w-4 h-4 text-[#0c0c0e]" />
              {altar ? "Guardar Cambios" : "Agregar Altar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
