import React, { useState } from "react";
import { User, Shield, Check } from "lucide-react";

export interface UserProfile {
  name: string;
  alliance: string;
}

interface ProfileSetupProps {
  onSave: (profile: UserProfile) => void;
  initialProfile?: UserProfile | null;
}

export default function ProfileSetup({ onSave, initialProfile }: ProfileSetupProps) {
  const [name, setName] = useState(initialProfile?.name || "");
  const [alliance, setAlliance] = useState(initialProfile?.alliance || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave({
        name: name.trim().toUpperCase(),
        alliance: alliance.trim().toUpperCase() || "SIN ALIANZA"
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0c0c0e] w-full max-w-sm rounded-xl border border-[#27272a] shadow-2xl relative">
        <div className="p-6 text-center border-b border-[#27272a] bg-[#111113] rounded-t-xl">
          <div className="mx-auto w-12 h-12 bg-gold-clan/10 text-gold-clan rounded-full flex items-center justify-center mb-3">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-serif font-bold text-[#e4e4e7] uppercase tracking-widest">Identificación</h2>
          <p className="text-[#a1a1aa] text-[10px] font-mono mt-2">INGRESE SUS DATOS PARA EL REGISTRO DE AUDITORÍA DE LA APLICACIÓN</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[#a1a1aa] text-[10px] uppercase tracking-wider font-bold mb-1.5 flex justify-between items-center">
              <span>Nombre de Jugador *</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#71717a] absolute left-3 top-2.5" />
              <input
                required
                type="text"
                placeholder="Ej. Lord Commander"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 bg-[#18181b] border border-[#3f3f46] rounded text-sm text-[#e4e4e7] p-2 focus:ring-1 focus:ring-gold-clan focus:border-gold-clan outline-none uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#a1a1aa] text-[10px] uppercase tracking-wider font-bold mb-1.5 flex justify-between items-center">
              <span>Alianza</span>
            </label>
            <div className="relative">
              <Shield className="w-4 h-4 text-[#71717a] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Ej. UNR"
                value={alliance}
                onChange={(e) => setAlliance(e.target.value)}
                className="w-full pl-9 bg-[#18181b] border border-[#3f3f46] rounded text-sm text-[#e4e4e7] p-2 focus:ring-1 focus:ring-gold-clan focus:border-gold-clan outline-none uppercase"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full mt-2 px-6 py-3 font-mono text-xs font-bold text-[#0c0c0e] bg-gold-clan hover:bg-gold-hover disabled:bg-[#3f3f46] disabled:text-[#71717a] rounded shadow-sm transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
          >
            <Check className="w-4 h-4" />
            Ingresar al Sistema
          </button>
        </form>
      </div>
    </div>
  );
}
