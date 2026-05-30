import React, { useState } from "react";
import { parsePastedOutposts, calculateExpiration } from "../utils/parser";
import { Altar } from "../types";
import { Clipboard, Check, RefreshCw, AlertTriangle, Play, HelpCircle } from "lucide-react";

interface QuickImporterProps {
  onImport: (importedAltars: Altar[]) => void;
  onClose: () => void;
}

export default function QuickImporter({ onImport, onClose }: QuickImporterProps) {
  const [pastedText, setPastedText] = useState("");
  const [parsedAltars, setParsedAltars] = useState<Partial<Altar>[]>([]);
  const [isReviewed, setIsReviewed] = useState(false);
  const [importMode, setImportMode] = useState<"merge" | "overwrite">("merge");

  const [showHelp, setShowHelp] = useState(false);

  const handleParse = () => {
    if (!pastedText.trim()) return;
    const items = parsePastedOutposts(pastedText);
    setParsedAltars(items);
    setIsReviewed(true);
  };

  const handleFinalImport = () => {
    if (parsedAltars.length === 0) return;

    const finalAltars: Altar[] = parsedAltars.map((item, idx) => {
      const nowStr = new Date().toISOString();
      return {
        id: item.id || `imported_${idx}_${Date.now()}`,
        name: item.name || "Altar Desconocido",
        level: item.level || 1,
        effect: item.effect || "Sin efecto",
        neighbors: item.neighbors || [],
        occupiedBy: item.occupiedBy || "DESCONOCIDO",
        protectionTimeInput: item.protectionTimeInput || "",
        protectionExpiresAt: item.protectionTimeInput 
          ? calculateExpiration(item.protectionTimeInput) 
          : null,
        createdAt: nowStr,
        updatedAt: nowStr,
        notes: item.notes || "Importado mediante texto"
      };
    });

    onImport(finalAltars);
    onClose();
  };

  const helpTemplate = `Puestos de Avanzadas (ALTARES)
- Gremio de Constructores Nivel 1
  Velocidad de Construcción +5.0%
  Vecinos: UNR, LTS, LAT
  Ocupado por: LTS
  Tiempo de protección: 1d 03:50 H`;

  return (
    <div className="fixed inset-0 bg-[#08080a]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0c0c0e] border border-[#27272a] rounded-lg w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="p-5 border-b border-[#27272a] flex items-center justify-between">
          <div>
            <h3 className="text-xs sm:text-sm font-serif font-semibold uppercase tracking-widest text-gold-clan flex items-center gap-2">
              <Clipboard className="w-5 h-5 text-gold-clan" /> IMPORTADOR RÁPIDO DESDE CHAT
            </h3>
            <p className="text-xs text-[#71717a] mt-1">
              Pega la lista de altares copiada directamente de Discord, WhatsApp o del juego. El sistema la analizará automáticamente.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#71717a] hover:text-white text-xs px-3 py-1.5 rounded font-mono transition-colors uppercase tracking-wider"
          >
            Cerrar
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {!isReviewed ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono font-bold text-[#71717a] uppercase tracking-widest block">
                  Área de Pegado de Texto
                </label>
                <button
                  type="button"
                  onClick={() => setShowHelp(!showHelp)}
                  className="text-xs text-gold-clan hover:text-[#967432] flex items-center gap-1 cursor-pointer font-semibold uppercase font-mono text-[10px] tracking-wider"
                >
                  <HelpCircle className="w-3.5 h-3.5" /> {showHelp ? "Ocultar Ejemplo" : "Ver Formato Soportado"}
                </button>
              </div>

              {showHelp && (
                <div className="bg-[#18181b]/50 p-4 rounded border border-[#27272a] text-xs text-[#a8a29e] space-y-2 font-mono">
                  <p className="text-[#e4e4e7] font-semibold mb-1 uppercase tracking-wider text-[11px]">Ejemplo de formato soportado:</p>
                  <pre className="text-[11px] leading-relaxed select-all whitespace-pre-wrap bg-[#111113] p-2.5 rounded border border-[#27272a]/60 text-[#a8a29e]">
                    {helpTemplate}
                  </pre>
                  <p className="text-[10px] text-[#71717a]">
                    * El analizador busca líneas de título comenzando con guión (-) y palabras clave como "Vecinos:", "Ocupado por:" y "protección:".
                  </p>
                </div>
              )}

              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Pega tu texto aquí... Ejemplo:&#10;- Gremio de Constructores Nivel 1&#10;  Velocidad de Construcción +5.0%&#10;  Vecinos: UNR, LTS, LAT&#10;  Ocupado por: LTS&#10;  Tiempo de protección: 1d 03:50 H"
                className="w-full h-64 bg-[#18181b] border border-[#27272a] rounded focus:border-gold-clan p-4 text-xs font-mono text-[#f4f4f5] placeholder-[#71717a] outline-none transition-all"
              />

              <div className="flex justify-end">
                <button
                  onClick={handleParse}
                  disabled={!pastedText.trim()}
                  className="bg-gold-clan hover:bg-[#967432] disabled:bg-[#18181b] disabled:text-[#71717a] text-[#0c0c0e] px-5 py-2.5 rounded text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-gold-clan/10"
                >
                  <Play className="w-4 h-4 fill-current text-[#0c0c0e]" /> Analizar Texto
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Review status */}
              <div className="bg-green-950/20 border border-green-900/30 rounded p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-green-400 font-bold block uppercase tracking-widest">
                    ANÁLISIS COMPLETADO
                  </span>
                  <span className="text-xs sm:text-sm text-white font-medium">
                    Se detectaron {parsedAltars.length} Puestos de Avanzada (Altares) en el texto.
                  </span>
                </div>
                <button
                  onClick={() => setIsReviewed(false)}
                  className="bg-[#18181b] hover:bg-[#27272a] text-[#a8a29e] hover:text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-[#27272a]"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-gold-clan" /> Volver a Pegar
                </button>
              </div>

              {/* Advanced Settings */}
              <div className="bg-[#111113] p-4 rounded border border-[#27272a] grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono font-bold text-[#71717a] uppercase tracking-widest block mb-2">
                    Modo de Inserción:
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs text-[#a8a29e] cursor-pointer">
                      <input
                        type="radio"
                        checked={importMode === "merge"}
                        onChange={() => setImportMode("merge")}
                        className="accent-gold-clan"
                      />
                      <div>
                        <span className="font-bold text-[#f4f4f5] block">Fusionar y Mantener Existentes</span>
                        <span className="text-[#71717a] text-[10px]">Actualiza coincidencias de nombre, añade registros nuevos.</span>
                      </div>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-[#a8a29e] cursor-pointer">
                      <input
                        type="radio"
                        checked={importMode === "overwrite"}
                        onChange={() => setImportMode("overwrite")}
                        className="accent-gold-clan"
                      />
                      <div>
                        <span className="font-bold text-rose-400 block">Reemplazar Base de Datos</span>
                        <span className="text-[#71717a] text-[10px]">Borra todos los altares actuales y guárdala con esta lista.</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="bg-amber-950/20 border border-amber-900/30 rounded p-3 text-[11px] text-amber-550 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>
                    El tiempo de protección se recalculará desde este momento utilizando los lapsos del texto pegado (ej. 1d 03h 50m desde ahora).
                  </span>
                </div>
              </div>

              {/* Table of extracted */}
              <div className="border border-[#27272a] rounded overflow-hidden bg-[#0c0c0e]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#111113] border-b border-[#27272a] text-[#71717a] font-mono text-[10px] uppercase tracking-wider">
                      <th className="p-3">Nombre & Nivel</th>
                      <th className="p-3">Efecto</th>
                      <th className="p-3">Ocupado Por</th>
                      <th className="p-3">Vecinos</th>
                      <th className="p-3">Protección</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedAltars.map((alt, i) => (
                      <tr key={i} className="border-b border-[#27272a]/70 hover:bg-[#18181b]/50">
                        <td className="p-3 font-serif font-semibold text-[#f4f4f5]">
                          {alt.name} <span className="text-[9px] text-gold-clan font-mono bg-[#18181b] border border-gold-clan/10 px-1 py-0.5 rounded ml-1 font-bold">Lvl {alt.level}</span>
                        </td>
                        <td className="p-3 text-[#a8a29e]">{alt.effect}</td>
                        <td className="p-3 font-mono font-bold text-gold-clan">{alt.occupiedBy}</td>
                        <td className="p-3 text-[#71717a] font-mono text-[10px]">
                          {alt.neighbors?.join(", ") || "Ninguno"}
                        </td>
                        <td className="p-3 text-emerald-400 font-mono text-[10px] font-bold">
                          {alt.protectionTimeInput || "Ninguna"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#27272a]">
                <button
                  onClick={onClose}
                  className="bg-[#18181b] hover:bg-[#27272a] text-[#a8a29e] border border-[#27272a] px-4 py-2.5 rounded text-xs font-semibold font-mono transition-colors cursor-pointer uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleFinalImport}
                  className="bg-gold-clan hover:bg-[#967432] text-[#0c0c0e] px-6 py-2.5 rounded text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-gold-clan/10"
                >
                  <Check className="w-4 h-4 text-[#0c0c0e]" /> Confirmar e importar {parsedAltars.length} Registro(s)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export { parsePastedOutposts };
