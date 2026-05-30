import React, { useState } from "react";
import { Battle, Altar } from "../types";
import { Clock, Plus, Trash2, Edit2, ShieldAlert, Check, X, Calendar, Search, Swords } from "lucide-react";
import { formatRemainingTime } from "../utils/parser";

interface BattlePlannerProps {
  battles: Battle[];
  altars: Altar[];
  currentTime: Date;
  displayTz: string;
  onSaveBattle: (battle: Omit<Battle, "id" | "createdAt" | "updatedAt"> & { id?: string }) => void;
  onDeleteBattle: (id: string) => void;
}

export default function BattlePlanner({ battles, altars, currentTime, displayTz, onSaveBattle, onDeleteBattle }: BattlePlannerProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBattle, setEditingBattle] = useState<Battle | null>(null);

  const [formData, setFormData] = useState({
    altarId: "",
    startTime: "",
    attackingAlliance: "",
    defendingAlliance: "",
    status: "scheduled" as Battle["status"],
    notes: ""
  });

  const handleOpenForm = (battle?: Battle) => {
    if (battle) {
      setEditingBattle(battle);
      // Convert to local datetime-local format for the input
      let st = "";
      if (battle.startTime) {
        const d = new Date(battle.startTime);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        st = d.toISOString().slice(0, 16);
      }
      setFormData({
        altarId: battle.altarId,
        startTime: st,
        attackingAlliance: battle.attackingAlliance,
        defendingAlliance: battle.defendingAlliance,
        status: battle.status,
        notes: battle.notes || ""
      });
    } else {
      setEditingBattle(null);
      setFormData({
        altarId: "",
        startTime: "",
        attackingAlliance: "",
        defendingAlliance: "",
        status: "scheduled",
        notes: ""
      });
    }
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const isoStart = formData.startTime ? new Date(formData.startTime).toISOString() : "";
    
    onSaveBattle({
      id: editingBattle?.id,
      altarId: formData.altarId,
      startTime: isoStart,
      attackingAlliance: formData.attackingAlliance,
      defendingAlliance: formData.defendingAlliance,
      status: formData.status,
      notes: formData.notes
    });
    setIsFormOpen(false);
  };

  // Sort battles by start time
  const sortedBattles = [...battles].sort((a, b) => {
    const timeA = new Date(a.startTime).getTime() || 0;
    const timeB = new Date(b.startTime).getTime() || 0;
    return timeA - timeB;
  });

  const activeBattles = sortedBattles.filter(b => b.status === "scheduled" || b.status === "active");
  const pastBattles = sortedBattles.filter(b => b.status === "completed" || b.status === "cancelled");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-[#111113] p-6 rounded-lg border border-[#27272a]">
        <div>
          <h2 className="text-xl font-serif text-[#e4e4e7] uppercase tracking-wider">Centro de Mando: Planificador de Batallas</h2>
          <p className="text-[#a1a1aa] text-xs font-mono mt-1">Coordine asaltos y defensas. Monitoree caídas de escudo para operaciones sincronizadas.</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="bg-gold-clan text-[#0c0c0e] hover:bg-gold-hover px-4 py-2 font-mono text-[10px] font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-widest shadow-md shadow-gold-clan/10"
        >
          <Plus className="w-4 h-4" /> Nueva Operación
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Active operations */}
        <div className="bg-[#0c0c0e] border border-[#27272a] rounded-lg p-6">
          <h3 className="text-sm font-semibold text-[#e4e4e7] mb-6 flex items-center gap-2 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            Operaciones Activas y Programadas
          </h3>
          <div className="space-y-4">
            {activeBattles.length === 0 ? (
              <p className="text-[#71717a] text-xs font-mono">No hay operaciones planeadas.</p>
            ) : (
              activeBattles.map(battle => {
                const altar = altars.find(a => a.id === battle.altarId);
                const isStarted = new Date(battle.startTime) <= currentTime;
                
                return (
                  <div key={battle.id} className="bg-[#111113] border border-[#27272a] p-4 rounded-lg relative overflow-hidden group">
                    {/* Status indicator bar */}
                    <div className={`absolute top-0 left-0 w-1 h-full ${isStarted ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                    
                    <div className="pl-3 relative flex justify-between items-start">
                      <div>
                        {isStarted ? (
                          <div className="text-[10px] text-red-400 font-bold tracking-widest mb-1 flex items-center gap-1 uppercase">
                            <Swords className="w-3 h-3" /> Batalla en Curso
                          </div>
                        ) : (
                          <div className="text-[10px] text-blue-400 font-bold tracking-widest mb-1 flex items-center gap-1 uppercase">
                            <Clock className="w-3 h-3" /> Programada
                          </div>
                        )}
                        <h4 className="text-sm font-bold text-[#e4e4e7]">{altar?.name || "Altar Desconocido"} <span className="text-[10px] text-[#71717a] ml-1 font-mono">Lvl {altar?.level}</span></h4>
                        <div className="text-[10px] font-mono mt-1 text-[#a1a1aa] bg-[#18181b] px-2 py-1 rounded inline-flex border border-[#27272a]">
                          {new Date(battle.startTime).toLocaleString('es-ES', { timeZone: displayTz, dateStyle: 'short', timeStyle: 'short' })} ({displayTz})
                        </div>
                        
                        <div className="flex items-center gap-2 mt-3 text-xs">
                          <span className="text-red-400 font-semibold">{battle.attackingAlliance || "Desconocido"}</span>
                          <span className="text-[#71717a] text-[10px]">vs</span>
                          <span className="text-blue-400 font-semibold">{battle.defendingAlliance || "Desconocido"}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenForm(battle)} className="text-[#71717a] hover:text-white p-1" title="Editar Operación">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { if(window.confirm('Eliminar operación?')) onDeleteBattle(battle.id); }} className="text-[#71717a] hover:text-red-400 p-1" title="Cancelar Operación">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Suggestion list based on vulnerable altars */}
        <div className="bg-[#0c0c0e] border border-[#27272a] rounded-lg p-6">
          <h3 className="text-sm font-semibold text-[#e4e4e7] mb-6 flex items-center gap-2 uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-gold-clan" />
            Blancos Potenciales
          </h3>
          <p className="text-[#71717a] text-[10px] font-mono mb-4">Altares cuyo escudo cae en las próximas 24 horas.</p>
          
          <div className="space-y-3">
            {altars.filter(a => {
              if(!a.protectionExpiresAt) return true; // already vulnerable
              const diff = new Date(a.protectionExpiresAt).getTime() - currentTime.getTime();
              return diff < 86400000 && diff > -86400000; // Drops within 24h or dropped recently
            })
            .sort((a, b) => {
              const aExp = a.protectionExpiresAt ? new Date(a.protectionExpiresAt).getTime() : 0;
              const bExp = b.protectionExpiresAt ? new Date(b.protectionExpiresAt).getTime() : 0;
              return aExp - bExp;
            })
            .slice(0, 10).map(altar => {
              const remains = altar.protectionExpiresAt ? formatRemainingTime(new Date(altar.protectionExpiresAt).getTime() - currentTime.getTime()) : "Vulnerable";
              const isVulnerable = !altar.protectionExpiresAt || new Date(altar.protectionExpiresAt) <= currentTime;
              
              const prefillBattle = () => {
                let st = "";
                if(altar.protectionExpiresAt) {
                    const d = new Date(altar.protectionExpiresAt);
                    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                    st = d.toISOString().slice(0, 16);
                }
                setFormData({
                    altarId: altar.id,
                    startTime: st,
                    attackingAlliance: "", // we attack
                    defendingAlliance: altar.occupiedBy || "", // they defend
                    status: "scheduled",
                    notes: "Operación en caída de escudo"
                });
                setEditingBattle(null);
                setIsFormOpen(true);
              }
              
              return (
                <div key={altar.id} className="flex items-center justify-between bg-[#111113] p-3 rounded-lg border border-[#27272a]">
                  <div>
                    <h4 className="text-xs font-bold text-[#e4e4e7]">{altar.name}</h4>
                    <div className="flex gap-2 text-[10px] font-mono mt-1">
                      <span className="text-[#71717a]">{altar.occupiedBy || "Sin ocupante"}</span>
                      {isVulnerable ? (
                        <span className="text-red-400">Vulnerable Ahora</span>
                      ) : (
                        <span className="text-gold-clan">{remains} para Caída</span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={prefillBattle}
                    className="text-[10px] px-2 py-1 bg-[#18181b] hover:bg-[#27272a] text-[#e4e4e7] border border-[#3f3f46] rounded font-mono transition-colors"
                  >
                    Planear Batalla
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>
      
      {/* Past Battles */}
      {pastBattles.length > 0 && (
          <div className="bg-[#0c0c0e] border border-[#27272a] rounded-lg p-6">
            <h3 className="text-sm font-semibold text-[#e4e4e7] mb-6 uppercase tracking-wider">Historial de Operaciones</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {pastBattles.map(battle => {
                   const altar = altars.find(a => a.id === battle.altarId);
                   return (
                       <div key={battle.id} className="bg-[#111113] p-3 rounded border border-[#27272a] opacity-60">
                           <div className="flex justify-between">
                             <div className="text-xs font-bold text-[#e4e4e7]">{altar?.name || "Altar Desconocido"}</div>
                             <div className="text-[10px] text-[#71717a]">{battle.status.toUpperCase()}</div>
                           </div>
                           <div className="text-[10px] font-mono mt-2 text-[#71717a]">{new Date(battle.startTime).toLocaleString('es-ES', { timeZone: displayTz, dateStyle: 'short', timeStyle: 'short' })}</div>
                       </div>
                   )
               })}
            </div>
          </div>
      )}

      {/* Battle Planner Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0c0c0e] w-full max-w-lg rounded-xl border border-[#27272a] shadow-2xl relative my-auto">
            <div className="p-4 sm:p-6 border-b border-[#27272a] flex justify-between items-center bg-[#111113] rounded-t-xl">
              <h2 className="text-lg font-serif font-bold text-[#e4e4e7] flex items-center gap-2">
                {editingBattle ? <Edit2 className="w-4 h-4 text-gold-clan" /> : <Swords className="w-4 h-4 text-gold-clan" />}
                {editingBattle ? "EDITAR OPERACIÓN" : "NUEVA OPERACIÓN"}
              </h2>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-[#71717a] hover:text-white p-1 rounded transition-colors hover:bg-[#27272a]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4">
              
              <div>
                <label className="block text-[#a1a1aa] text-[10px] uppercase tracking-wider font-bold mb-1.5 flex justify-between">
                  <span>Altar Objetivo *</span>
                </label>
                <select
                  required
                  value={formData.altarId}
                  onChange={(e) => setFormData({ ...formData, altarId: e.target.value })}
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded lg text-sm text-[#e4e4e7] p-2 focus:ring-1 focus:ring-gold-clan focus:border-gold-clan outline-none"
                >
                  <option value="" disabled>-- Seleccione un recinto --</option>
                  {altars.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Lvl {a.level}) - {a.occupiedBy || "Libre"}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-[#a1a1aa] text-[10px] uppercase tracking-wider font-bold mb-1.5 flex justify-between">
                  <span>Hora de Inicio Objetivo (Local) *</span>
                </label>
                <input
                  required
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded lg text-sm text-[#e4e4e7] p-2 focus:ring-1 focus:ring-gold-clan focus:border-gold-clan outline-none [color-scheme:dark]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#a1a1aa] text-[10px] uppercase tracking-wider font-bold mb-1.5 flex justify-between">
                      <span>Alianza Atacante *</span>
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Ej. UNR"
                      value={formData.attackingAlliance}
                      onChange={(e) => setFormData({ ...formData, attackingAlliance: e.target.value.toUpperCase() })}
                      className="w-full bg-[#18181b] border border-[#3f3f46] rounded lg text-sm text-[#e4e4e7] p-2 focus:ring-1 focus:ring-gold-clan outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#a1a1aa] text-[10px] uppercase tracking-wider font-bold mb-1.5 flex justify-between">
                      <span>Alianza Defensora</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. LTS"
                      value={formData.defendingAlliance}
                      onChange={(e) => setFormData({ ...formData, defendingAlliance: e.target.value.toUpperCase() })}
                      className="w-full bg-[#18181b] border border-[#3f3f46] rounded lg text-sm text-[#e4e4e7] p-2 focus:ring-1 focus:ring-gold-clan outline-none"
                    />
                  </div>
              </div>
              
              <div>
                <label className="block text-[#a1a1aa] text-[10px] uppercase tracking-wider font-bold mb-1.5">
                  Estado de Operación
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded lg text-sm text-[#e4e4e7] p-2 focus:ring-1 focus:ring-gold-clan focus:border-gold-clan outline-none"
                >
                  <option value="scheduled">Programada (Programada)</option>
                  <option value="active">En progreso (Activa)</option>
                  <option value="completed">Exitosa (Completada)</option>
                  <option value="cancelled">Abortada (Cancelada)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#a1a1aa] text-[10px] uppercase tracking-wider font-bold mb-1.5">
                  Notas Tácticas
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Detalles sobre las líneas de ataque..."
                  className="w-full min-h-[60px] bg-[#18181b] border border-[#3f3f46] rounded lg text-sm text-[#e4e4e7] p-2 focus:ring-1 focus:ring-gold-clan focus:border-gold-clan outline-none custom-scrollbar"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 flex-col sm:flex-row border-t border-[#27272a] mt-6">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 font-mono text-[10px] font-bold text-[#a1a1aa] hover:text-white bg-[#18181b] hover:bg-[#27272a] rounded shadow-sm border border-[#3f3f46] transition-all uppercase tracking-widest text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 font-mono text-[10px] font-bold text-[#0c0c0e] bg-gold-clan hover:bg-gold-hover rounded shadow-sm transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                >
                  <Check className="w-3.5 h-3.5" />
                  Guardar Orden
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
