import React from "react";
import { AuditLog } from "../types";
import { History, ArrowRight, User } from "lucide-react";

interface AuditLogViewerProps {
  logs: AuditLog[];
  displayTz: string;
}

export default function AuditLogViewer({ logs, displayTz }: AuditLogViewerProps) {
  return (
    <div className="bg-[#0c0c0e] border border-[#27272a] rounded-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-[#18181b] border border-[#27272a] rounded-md">
          <History className="w-5 h-5 text-gold-clan" />
        </div>
        <div>
          <h2 className="text-lg font-serif font-bold text-[#e4e4e7] uppercase tracking-wider">Historial de Operaciones</h2>
          <p className="text-[#a1a1aa] text-[10px] font-mono tracking-widest uppercase mt-0.5">Registro de auditoría y cambios en el sistema</p>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-12 border border-[#27272a] border-dashed rounded-lg bg-[#111113]">
          <History className="w-8 h-8 text-[#3f3f46] mx-auto mb-3" />
          <p className="text-[#a1a1aa] font-mono text-xs">No hay registros de cambios de ocupación todavía.</p>
          <p className="text-[#71717a] font-mono text-[10px] mt-1">Los cambios se registrarán automáticamente al actualizar un recinto.</p>
        </div>
      ) : (
        <div className="relative border-l border-[#27272a] ml-4 sm:ml-6 space-y-8 pb-4">
          {logs.map((log) => (
            <div key={log.id} className="relative pl-6 sm:pl-8">
              {/* Timeline dot */}
              <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-[#18181b] border-2 border-gold-clan"></div>
              
              <div className="bg-[#111113] border border-[#27272a] rounded-lg p-4 transition-colors hover:border-[#3f3f46]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold tracking-widest font-mono uppercase bg-[#18181b] border border-[#27272a] text-[#a1a1aa]">
                      {log.action?.replace(/_/g, ' ') || "CAMBIO"}
                    </span>
                    <h3 className="font-bold text-[#e4e4e7] text-sm">{log.altarName || log.details || "Desconocido"}</h3>
                  </div>
                  <div className="text-[10px] font-mono text-[#a1a1aa] bg-[#18181b] px-2 py-1 rounded border border-[#27272a] inline-block">
                    {new Date(log.timestamp).toLocaleString('es-ES', { timeZone: displayTz, dateStyle: 'short', timeStyle: 'short' })} ({displayTz})
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2 text-[10px] font-mono font-bold">
                  <User className="w-3 h-3 text-[#71717a]" />
                  <span className="text-gold-clan">{log.player}</span>
                  <span className="text-[#a1a1aa] px-1">en</span>
                  <span className="bg-[#18181b] border border-[#3f3f46] px-1.5 py-0.5 rounded text-[#e4e4e7]">{log.alliance}</span>
                </div>
                
                {log.action === "OCCUPANT_CHANGE" && (
                  <div className="flex items-center gap-3 mt-3 bg-[#0c0c0e] p-3 rounded border border-[#18181b]">
                    <div className="flex-1 text-center">
                      <span className="text-[10px] text-[#71717a] font-mono block mb-1">Previamente</span>
                      <span className="text-xs font-bold font-mono text-red-400 bg-red-400/10 px-2 py-0.5 rounded">
                        {log.previousOccupant || "DESCONOCIDO"}
                      </span>
                    </div>
                    
                    <ArrowRight className="w-4 h-4 text-[#3f3f46] shrink-0" />
                    
                    <div className="flex-1 text-center">
                      <span className="text-[10px] text-[#71717a] font-mono block mb-1">Capturado por</span>
                      <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
                        {log.newOccupant || "LIBRE"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
