import React, { useState, useEffect, useCallback, useRef } from "react";
import { Altar, Battle, AuditLog } from "./types";
import { motion, AnimatePresence } from "framer-motion";
import { INITIAL_ALTAR_PRESETS, calculateExpiration, formatRemainingTime } from "./utils/parser";
import StatsDashboard from "./components/StatsDashboard";
import MapVisualization from "./components/MapVisualization";
import AltarCard from "./components/AltarCard";
import AltarForm from "./components/AltarForm";
import QuickImporter from "./components/QuickImporter";
import BattlePlanner from "./components/BattlePlanner"; 
import ClockWidget from "./components/ClockWidget";
import AuditLogViewer from "./components/AuditLogViewer";
import ProfileSetup, { UserProfile } from "./components/ProfileSetup";
import { 
  Plus, 
  Search, 
  Clipboard, 
  Download, 
  Upload, 
  HelpCircle, 
  LayoutGrid, 
  List, 
  RotateCcw,
  Clock,
  ExternalLink,
  ShieldAlert,
  ShieldAlert as AlertTriangle,
  Swords,
  History,
  User as UserIcon,
  LogOut
} from "lucide-react";

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // 1. Core State
  const [altars, setAltars] = useState<Altar[]>([]);
  const [battles, setBattles] = useState<Battle[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOccupier, setFilterOccupier] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all' | 'protected' | 'vulnerable'
  const [sortBy, setSortBy] = useState("expiry"); // 'expiry' | 'level' | 'name' | 'occupiedBy'
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<"altars" | "battles" | "audit">("altars");
  const [displayTz, setDisplayTz] = useState("UTC"); // Default to UTC

  // Interaction States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAltar, setEditingAltar] = useState<Altar | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedAlliance, setSelectedAlliance] = useState<string | null>(null);
  
  // Real Time Tick Helper
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const saved = localStorage.getItem("remix_user_profile");
    if (saved) {
      try {
        setUserProfile(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveProfile = (profile: UserProfile) => {
    localStorage.setItem("remix_user_profile", JSON.stringify(profile));
    setUserProfile(profile);
  };

  const apiFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      ...((options.headers as Record<string, string>) || {})
    };
    if (userProfile) {
      headers["X-Player-Name"] = userProfile.name;
      headers["X-Player-Alliance"] = userProfile.alliance;
    }
    return fetch(url, { ...options, headers });
  }, [userProfile]);

  // 2. Load initially
  useEffect(() => {
    async function loadAltars() {
      try {
        const res = await apiFetch("/api/altars");
        if (!res.ok) throw new Error("Network response was not ok");
        const data = await res.json();
        if (data.length === 0) {
          // If DB is totally empty, seed it with presets
          await apiFetch("/api/altars/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(INITIAL_ALTAR_PRESETS)
          });
          setAltars(INITIAL_ALTAR_PRESETS);
        } else {
          setAltars(data);
        }
      } catch (err) {
        console.error("Error loading altars from DB:", err);
        setAltars(INITIAL_ALTAR_PRESETS); // fallback on error
      }
    }

    async function loadBattles() {
      try {
        const res = await apiFetch("/api/battles");
        if (res.ok) {
          const data = await res.json();
          setBattles(data);
        }
      } catch (err) {
        console.error("Error loading battles:", err);
      }
    }

    async function loadAuditLogs() {
      try {
        const res = await apiFetch("/api/audit_logs");
        if (res.ok) {
          const data = await res.json();
          setAuditLogs(data);
        }
      } catch (err) {
        console.error("Error loading audit logs:", err);
      }
    }

    loadAltars();
    loadBattles();
    loadAuditLogs();
  }, [apiFetch]);

  // Polling for real-time sync (Vercel friendly instead of WebSockets)
  useEffect(() => {
    const syncInterval = setInterval(() => {
      apiFetch("/api/altars")
        .then((res) => res.json())
        .then((data) => setAltars(data))
        .catch((err) => console.error("Sync error:", err));
      
      apiFetch("/api/battles")
        .then((res) => res.json())
        .then((data) => setBattles(data))
        .catch((err) => console.error("Sync error:", err));
    }, 15000); // Poll every 15 seconds

    return () => clearInterval(syncInterval);
  }, []);

  const refreshAuditLogs = useCallback(() => {
    try {
      const res = apiFetch("/api/audit_logs");
      res.then(r => { if (r.ok) r.json().then(d => setAuditLogs(d)) });
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Notification State
  const notifiedAltarsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission !== "denied" && Notification.permission !== "granted") {
        Notification.requestPermission();
      }
    }
  }, []);

  // Tick timer every second for countdown representation
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Check for notifications
      altars.forEach(altar => {
        if (altar.protectionExpiresAt) {
          const expiryDate = new Date(altar.protectionExpiresAt);
          const timeDiffMs = expiryDate.getTime() - now.getTime();
          const minutesRemaining = timeDiffMs / (1000 * 60);

          if (minutesRemaining > 0 && minutesRemaining <= 30) {
            const notifKey = `${altar.id}-${altar.protectionExpiresAt}`; 
            if (!notifiedAltarsRef.current.has(notifKey)) {
                notifiedAltarsRef.current.add(notifKey);
                
                if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
                    new Notification("Defensas en riesgo", {
                        body: `El escudo de ${altar.name} expira en menos de 30 minutos.`
                    });
                }
            }
          }
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [altars]);

  // 3. CRUD actions
  const handleSaveAltar = async (formData: Omit<Altar, "id" | "createdAt" | "updatedAt"> & { id?: string }) => {
    const nowStr = new Date().toISOString();
    
    if (formData.id) {
      // Edit Mode
      const alt = altars.find(a => a.id === formData.id);
      if (!alt) return;
      
      let newExpiry = alt.protectionExpiresAt;
      if (alt.protectionTimeInput !== formData.protectionTimeInput) {
        newExpiry = formData.protectionTimeInput
          ? calculateExpiration(formData.protectionTimeInput)
          : null;
      }
      
      const payload = {
        ...alt,
        ...formData,
        protectionExpiresAt: newExpiry,
        updatedAt: nowStr
      } as Altar;
      
      try {
        const res = await apiFetch(`/api/altars/${formData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setAltars(altars.map(a => a.id === formData.id ? payload : a));
          refreshAuditLogs();
        }
      } catch (err) {
        console.error("Error updating altar:", err);
      }
    } else {
      // Create Mode
      const newAltar: Altar = {
        id: `altar_${Date.now()}`,
        name: formData.name,
        level: formData.level,
        effect: formData.effect,
        neighbors: formData.neighbors,
        occupiedBy: formData.occupiedBy,
        protectionTimeInput: formData.protectionTimeInput,
        protectionExpiresAt: formData.protectionTimeInput
          ? calculateExpiration(formData.protectionTimeInput)
          : null,
        createdAt: nowStr,
        updatedAt: nowStr,
        notes: formData.notes
      };
      
      try {
        const res = await apiFetch("/api/altars", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newAltar)
        });
        if (res.ok) {
          setAltars([...altars, newAltar]);
          refreshAuditLogs();
        }
      } catch (err) {
        console.error("Error creating altar:", err);
      }
    }
    setEditingAltar(null);
  };

  const handleDeleteAltar = async (id: string) => {
    if (window.confirm("¿Está seguro que desea eliminar este altar?")) {
      try {
        const res = await apiFetch(`/api/altars/${id}`, { method: "DELETE" });
        if (res.ok) {
          setAltars(altars.filter(a => a.id !== id));
          refreshAuditLogs();
        }
      } catch (err) {
        console.error("Error deleting altar:", err);
      }
    }
  };

  const handleQuickChangeOccupant = async (id: string, newOccupant: string) => {
    const alt = altars.find(a => a.id === id);
    if (!alt) return;
    
    const payload = {
      ...alt,
      occupiedBy: newOccupant.toUpperCase().trim(),
      protectionExpiresAt: alt.protectionTimeInput 
        ? calculateExpiration(alt.protectionTimeInput)
        : null,
      updatedAt: new Date().toISOString()
    };
    
    try {
      const res = await apiFetch(`/api/altars/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setAltars(altars.map(a => a.id === id ? payload : a));
        refreshAuditLogs();
      }
    } catch (err) {
      console.error("Error quick changing occupant:", err);
    }
  };

  const handleRefreshProtection = async (id: string) => {
    const alt = altars.find(a => a.id === id);
    if (!alt) return;
    
    const payload = {
      ...alt,
      protectionExpiresAt: alt.protectionTimeInput 
        ? calculateExpiration(alt.protectionTimeInput)
        : null,
      updatedAt: new Date().toISOString()
    };
    
    try {
      const res = await apiFetch(`/api/altars/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setAltars(altars.map(a => a.id === id ? payload : a));
      }
    } catch (err) {
      console.error("Error refreshing protection:", err);
    }
  };

  // Bulk Import Actions
  const handleBulkImport = async (newAltars: Altar[]) => {
    try {
      const res = await apiFetch("/api/altars/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAltars)
      });
      if (res.ok) {
        setAltars(newAltars);
        refreshAuditLogs();
      }
    } catch (err) {
      console.error("Error in bulk import:", err);
    }
  };

  // Restore Default presets
  const handleResetToPresets = async () => {
    if (window.confirm("¿Estás seguro de que deseas restablecer la base de datos a los 10 altares por defecto? Perderás tus modificaciones actuales.")) {
      try {
        const res = await apiFetch("/api/altars/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(INITIAL_ALTAR_PRESETS)
        });
        if (res.ok) {
          setAltars(INITIAL_ALTAR_PRESETS);
        }
      } catch (err) {
        console.error("Error resetting to presets:", err);
      }
    }
  };

  // Backup Tools: JSON Export & Import
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(altars, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `copia-seguridad-altares-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const parsed = JSON.parse(event.target?.result as string);
            if (Array.isArray(parsed)) {
              if (window.confirm(`Se encontraron ${parsed.length} altares en la copia de seguridad. ¿Deseas importarlos?`)) {
                handleBulkImport(parsed);
              }
            } else {
              alert("Formato de copia de seguridad inválido.");
            }
          } catch (err) {
            alert("Error al leer el archivo JSON.");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Focus Altar triggered from MapVisualization clicking
  const handleSelectAltarFromMap = (altar: Altar) => {
    setSearchQuery(altar.name.replace(/\sNivel\s\d+/i, "")); // filter search to focus list on it
    // Scroll smoothly to list
    const el = document.getElementById("panel-list");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Alliances list in selectors
  const allOccupiers = Array.from(new Set(altars.map(a => (a.occupiedBy || "").toUpperCase().trim()))).filter(Boolean);

  // 4. Filtering and Sorting logic
  const filteredAltars = altars.filter(altar => {
    // Search filter
    const matchesSearch = 
      altar.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      altar.effect.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (altar.notes || "").toLowerCase().includes(searchQuery.toLowerCase());

    // Occupier filter (either dropdown or clicked alliance filter from StatsDashboard)
    const normalizedOccupier = (altar.occupiedBy || "").toUpperCase().trim();
    const finalOccupierFilter = selectedAlliance || filterOccupier;
    const matchesOccupier = !finalOccupierFilter || normalizedOccupier === finalOccupierFilter.toUpperCase().trim();

    // Protection status filter
    const isProtected = altar.protectionExpiresAt ? new Date(altar.protectionExpiresAt) > currentTime : false;
    let matchesStatus = true;
    if (filterStatus === "protected") matchesStatus = isProtected;
    if (filterStatus === "vulnerable") matchesStatus = !isProtected;

    return matchesSearch && matchesOccupier && matchesStatus;
  }).sort((a, b) => {
    // Sorter logic
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === "level") {
      return b.level - a.level;
    }
    if (sortBy === "occupiedBy") {
      return a.occupiedBy.localeCompare(b.occupiedBy);
    }
    // expiry date sort (by default)
    const aExpiry = a.protectionExpiresAt ? new Date(a.protectionExpiresAt).getTime() : 0;
    const bExpiry = b.protectionExpiresAt ? new Date(b.protectionExpiresAt).getTime() : 0;
    
    // Sort logic: active countdowns showing longest remaining on top, then expired/vulnerable on bottom
    const isAPending = aExpiry > currentTime.getTime();
    const isBPending = bExpiry > currentTime.getTime();
    if (isAPending && isBPending) {
      return aExpiry - bExpiry; // closest expiry first
    }
    if (isAPending) return -1; // showing protected on top
    if (isBPending) return 1;

    // Both vulnerable, sort alphabetically by name
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="min-h-screen bg-[#08080a] text-[#d4d4d8] font-sans selection:bg-gold-clan selection:text-[#08080a] pb-16 antialiased">
      {!userProfile && (
        <ProfileSetup onSave={saveProfile} initialProfile={userProfile} />
      )}
      
      {/* Top Combat Header info */}
      <header className="border-b border-[#27272a] bg-[#0c0c0e] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-16 flex flex-col sm:flex-row items-center justify-between py-2 sm:py-0">
          
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start mb-2 sm:mb-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gold-clan rounded-sm rotate-45 flex items-center justify-center shrink-0 shadow-lg shadow-gold-clan/10 animate-pulse">
                <div className="w-4 h-4 border border-[#08080a]"></div>
              </div>
              <div>
                <h1 className="text-md sm:text-lg font-serif font-semibold tracking-widest text-[#e2e2e8] uppercase leading-tight">
                  GESTIÓN DE ALTARES
                </h1>
                <p className="text-[10px] text-gold-clan font-mono tracking-widest">
                  ESTRATEGIA • CONTROL DE FRONTERAS
                </p>
              </div>
            </div>
            
            <div className="sm:hidden">
              <ClockWidget displayTz={displayTz} setDisplayTz={setDisplayTz} />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <div className="hidden lg:flex gap-4 text-xs uppercase tracking-widest font-medium text-[#71717a] mr-2">
              <span className="text-emerald-500">Estado: Operacional</span>
            </div>

            {userProfile && (
              <div className="flex items-center gap-2 bg-[#18181b] border border-[#27272a] px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[9px] sm:text-[10px] font-mono leading-none">
                <UserIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gold-clan shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[#e4e4e7] font-bold uppercase truncate max-w-[80px] sm:max-w-[120px]">{userProfile.name}</span>
                  <span className="text-[#a1a1aa] uppercase truncate max-w-[80px] sm:max-w-[120px]">{userProfile.alliance}</span>
                </div>
                <div className="w-[1px] h-6 bg-[#3f3f46] mx-1"></div>
                <button 
                  onClick={() => setUserProfile(null)} 
                  title="Cambiar Identificación" 
                  className="text-[#71717a] hover:text-[#e4e4e7] ml-0.5 sm:ml-1 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>
            )}

            <div className="hidden sm:block">
              {/* Configurable Real Time Clock */}
              <ClockWidget displayTz={displayTz} setDisplayTz={setDisplayTz} />
            </div>

            {/* Core Preset Restorer */}
            <button
              onClick={handleResetToPresets}
              className="text-[10px] font-semibold text-[#71717a] hover:text-white bg-[#18181b] hover:bg-[#27272a] px-2.5 py-1.5 rounded border border-[#3f3f46] transition-all cursor-pointer flex items-center gap-1.5 font-mono uppercase"
              title="Restablecer base de datos inicial de altares"
            >
              <RotateCcw className="w-3 h-3 text-gold-clan" /> Restablecer
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* Navigation Tabs */}
        <div className="flex justify-center sm:justify-start items-center gap-1 border-b border-[#27272a] mb-6 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab("altars")}
            className={`px-5 py-3 text-sm font-semibold rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'altars' ? 'bg-[#0c0c0e] text-white border-t border-l border-r border-[#27272a]' : 'text-[#71717a] hover:text-white hover:bg-[#18181b]'}`}
          >
            <AlertTriangle className="w-4 h-4" /> Altares & Estadísticas
          </button>
          <button
            onClick={() => setActiveTab("battles")}
            className={`px-5 py-3 text-sm font-semibold rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'battles' ? 'bg-[#0c0c0e] text-white border-t border-l border-r border-[#27272a]' : 'text-[#71717a] hover:text-white hover:bg-[#18181b]'}`}
          >
            <Swords className="w-4 h-4" /> Batallas Planeadas
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-5 py-3 text-sm font-semibold rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'audit' ? 'bg-[#0c0c0e] text-white border-t border-l border-r border-[#27272a]' : 'text-[#71717a] hover:text-white hover:bg-[#18181b]'}`}
          >
            <History className="w-4 h-4" /> Historial de Ocupación
          </button>
        </div>

        <AnimatePresence mode="wait">
        {activeTab === "altars" ? (
          <motion.div 
            key="altars"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
          {/* Banner alert if empty */}
        {altars.length === 0 && (
          <div className="bg-yellow-950/25 border border-yellow-900/30 p-4 rounded-2xl text-yellow-300 text-xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="font-bold block text-sm mb-1">¡No hay altares registrados!</span>
              <span>Comienza agregando un altar individualmente o importa tu lista directamente de WhatsApp con el Importador Rápido.</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingAltar(null);
                  setIsFormOpen(true);
                }}
                className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold transition-all cursor-pointer"
              >
                + AGREGAR MANUALLY
              </button>
              <button
                onClick={() => setIsImportOpen(true)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold transition-all cursor-pointer"
              >
                📥 DE CHAT RAPID
              </button>
            </div>
          </div>
        )}

        {/* 1. Dashboard Analytics */}
        <StatsDashboard 
          altars={altars} 
          onSelectAlliance={(alliance) => setSelectedAlliance(alliance)}
          selectedAlliance={selectedAlliance}
        />

        {/* 2. Tactical border Threat Visualizer */}
        {altars.length > 0 && (
          <MapVisualization 
            altars={altars} 
            onSelectAltar={handleSelectAltarFromMap}
          />
        )}

        {/* 3. CRUD controls & list section */}
        <div id="panel-list" className="bg-[#0c0c0e] border border-[#27272a] rounded-lg p-6 space-y-6">
          
          {/* Section banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#27272a] pb-4">
            <div>
              <h2 className="text-md sm:text-lg font-serif font-semibold text-[#e2e2e8] tracking-widest uppercase flex items-center gap-2">
                📂 BASE DE DATOS DE ALTARES
              </h2>
              <p className="text-xs text-[#71717a]">
                Visualiza, realiza búsquedas, filtra y modifica la información de frontera, nivel, bonificadores y escudos.
              </p>
            </div>
 
            {/* Quick Actions create & import */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Export/Import Backup block */}
              <div className="flex bg-[#18181b] p-1 rounded border border-[#3f3f46] mr-1.5">
                <button
                  onClick={handleExportJSON}
                  title="Exportar archivo de copia de seguridad (.json)"
                  className="p-1.5 text-[#71717a] hover:text-white rounded hover:bg-[#27272a] cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleImportJSON}
                  title="Importar archivo de copia de seguridad de disco (.json)"
                  className="p-1.5 text-[#71717a] hover:text-white rounded hover:bg-[#27272a] cursor-pointer transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>
              </div>
 
              {/* Chat paste importer */}
              <button
                onClick={() => setIsImportOpen(true)}
                className="bg-[#18181b] hover:bg-[#27272a] border border-[#3f3f46] text-[#e4e4e7] font-semibold px-3 py-2 rounded text-xs flex items-center gap-1.5 transition-all cursor-pointer font-mono tracking-widest uppercase"
              >
                <Clipboard className="w-3.5 h-3.5 text-gold-clan" /> 
                <span>IMPORTAR D/ CHAT</span>
              </button>
 
              {/* Individual creation */}
              <button
                onClick={() => {
                  setEditingAltar(null);
                  setIsFormOpen(true);
                }}
                className="bg-gold-clan hover:bg-gold-hover text-[#0c0c0e] px-4 py-2 rounded text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer font-mono shadow-md shadow-gold-clan/10 uppercase tracking-widest"
              >
                <Plus className="w-4 h-4 text-[#0c0c0e] stroke-[3]" /> 
                <span>NUEVO ALTAR</span>
              </button>
            </div>
          </div>
 
          {/* Filtering bar, search and grid selectors */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
            {/* Search inputs */}
            <div className="md:col-span-4 relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#71717a]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por altar, efecto, notas..."
                className="w-full bg-[#18181b] border border-[#3f3f46] rounded pl-9 pr-3 py-2 text-xs font-mono text-[#e4e4e7] placeholder-[#71717a] outline-none focus:border-gold-clan focus:ring-1 focus:ring-gold-clan/50"
              />
            </div>
 
            {/* Filter by Alliance occupant */}
            <div className="md:col-span-2">
              <select
                value={selectedAlliance ? "dash_active" : filterOccupier}
                onChange={(e) => {
                  if (e.target.value === "dash_active") {
                    setSelectedAlliance(null); // clears dashboard active
                    setFilterOccupier("");
                  } else {
                    setSelectedAlliance(null);
                    setFilterOccupier(e.target.value);
                  }
                }}
                className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-xs font-mono text-[#e4e4e7] focus:outline-none focus:border-gold-clan cursor-pointer"
              >
                <option value="">-- Todos Ocupantes --</option>
                {selectedAlliance && (
                  <option value="dash_active">★ Filtro Gráf: {selectedAlliance} (Limpiar)</option>
                )}
                {allOccupiers.map(occ => (
                  <option key={occ} value={occ}>{occ}</option>
                ))}
              </select>
            </div>
 
            {/* Filter by status */}
            <div className="md:col-span-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-xs font-mono text-[#e4e4e7] focus:outline-none focus:border-gold-clan cursor-pointer"
              >
                <option value="all">-- Todos Estados --</option>
                <option value="protected">🛡️ Protegidos</option>
                <option value="vulnerable">⚠️ Vulnerables</option>
              </select>
            </div>
 
            {/* Sorter selection */}
            <div className="md:col-span-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-xs font-mono text-[#e4e4e7] focus:outline-none focus:border-gold-clan cursor-pointer"
              >
                <option value="expiry">⏳ Orden de Escudo</option>
                <option value="name">🔤 Nombre Altar</option>
                <option value="level">⭐ Nivel Altar</option>
                <option value="occupiedBy">👑 Alianza Dueña</option>
              </select>
            </div>
 
            {/* Grid vs Compact list list view switcher */}
            <div className="md:col-span-2 flex justify-end gap-1.5 self-center">
              <button
                onClick={() => setViewType("grid")}
                title="Vista Cuadrícula"
                className={`p-2 rounded cursor-pointer ${viewType === "grid" ? "bg-[#18181b] text-gold-clan border border-gold-clan" : "text-[#71717a] hover:text-[#e4e4e7] hover:bg-[#18181b]/50 border border-transparent"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewType("list")}
                title="Vista Compacta de Tabla"
                className={`p-2 rounded cursor-pointer ${viewType === "list" ? "bg-[#18181b] text-gold-clan border border-gold-clan" : "text-[#71717a] hover:text-[#e4e4e7] hover:bg-[#18181b]/50 border border-transparent"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
 
          {/* Active stats display filter alert */}
          {selectedAlliance && (
            <div className="bg-[#18181b] p-3 rounded border border-[#27272a] flex items-center justify-between text-xs font-mono font-medium">
              <span className="text-[#a8a29e]">
                Mostrando únicamente altares ocupados por la Alianza: <span className="text-white font-bold">{selectedAlliance}</span> (Filtro desde Gráfica de control).
              </span>
              <button 
                onClick={() => setSelectedAlliance(null)}
                className="text-gold-clan hover:text-gold-hover underline cursor-pointer"
              >
                Quitar filtro
              </button>
            </div>
          )}
 
          {/* Core Results display */}
          {filteredAltars.length > 0 ? (
            viewType === "grid" ? (
              /* GRID view list */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredAltars.map(altar => (
                  <AltarCard 
                    key={altar.id}
                    altar={altar}
                    onEdit={(a) => {
                      setEditingAltar(a);
                      setIsFormOpen(true);
                    }}
                    onDelete={handleDeleteAltar}
                    onQuickChangeOccupant={handleQuickChangeOccupant}
                    onRefreshProtection={handleRefreshProtection}
                  />
                ))}
              </div>
            ) : (
              /* COMPACT TABULAR LISTVIEW */
              <div className="border border-[#27272a] rounded-lg overflow-hidden bg-[#0c0c0e]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#111113] border-b border-[#27272a] text-[#71717a] font-mono text-[10px] uppercase tracking-wider">
                      <th className="py-3 px-4">Altar & Nivel</th>
                      <th className="py-3 px-4">Efectos</th>
                      <th className="py-3 px-4">Ocupador</th>
                      <th className="py-3 px-4">Fronteras / Vecinos</th>
                      <th className="py-3 px-4">Tiempo Escudo restante</th>
                      <th className="py-3 px-4 text-right">Herramientas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAltars.map(altar => {
                      const isShielded = altar.protectionExpiresAt ? new Date(altar.protectionExpiresAt) > currentTime : false;
                      const remMs = altar.protectionExpiresAt ? new Date(altar.protectionExpiresAt).getTime() - currentTime.getTime() : 0;
                      
                      return (
                        <tr key={altar.id} className="border-b border-[#27272a] hover:bg-[#18181b]/30 transition-colors">
                          <td className="py-3.5 px-4 font-serif font-semibold text-[#f4f4f5]">
                            <div>
                              <span>{altar.name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs font-sans text-[#d4d4d8]">
                            {altar.effect}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-gold-clan uppercase">
                            {altar.occupiedBy || "NINGUNO"}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1">
                              {altar.neighbors.map((n, key) => (
                                <span key={key} className="text-[10px] font-mono bg-[#18181b] px-1.5 py-0.5 rounded text-[#a8a29e] border border-[#27272a]">
                                  {n}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold">
                            {isShielded ? (
                              <span className="text-emerald-500">
                                {formatRemainingTime(remMs)}
                              </span>
                            ) : (
                              <span className="text-rose-500 flex items-center gap-1">
                                <ShieldAlert className="w-3.5 h-3.5" /> Vulnerable
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-1 shrink-0">
                            <button
                              onClick={() => handleRefreshProtection(altar.id)}
                              className="px-2 py-1 bg-[#18181b] text-gold-clan hover:bg-[#27272a] border border-[#3f3f46] text-[10px] rounded font-mono font-semibold transition-all inline-block cursor-pointer"
                              title="Reiniciar/Renovar Escudo"
                            >
                              Renovar
                            </button>
                            <button
                              onClick={() => {
                                setEditingAltar(altar);
                                setIsFormOpen(true);
                              }}
                              className="px-2 py-1 bg-[#18181b] hover:bg-[#27272a] text-[#e4e4e7] border border-[#3f3f46] text-[10px] rounded font-mono font-semibold transition-all inline-block cursor-pointer"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteAltar(altar.id)}
                              className="px-2 py-1 bg-rose-950/20 text-rose-400 hover:bg-rose-950/45 border border-rose-900/35 text-[10px] rounded font-mono font-bold transition-all inline-block cursor-pointer"
                            >
                              Elimina
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="text-center py-16 bg-[#0c0c0e]/50 rounded border border-[#27272a]">
              <span className="block text-[#71717a] font-mono text-xs uppercase mb-1">Sin resultados</span>
              <span className="text-[#a8a29e] text-xs">
                No hay ningún altar que cumpla con los filtros activos. Intente limpiar su término de búsqueda.
              </span>
            </div>
          )}
        </div>
        </motion.div>
        ) : activeTab === "battles" ? (
          <motion.div 
            key="battles"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
          <BattlePlanner 
            battles={battles} 
            altars={altars}
            currentTime={currentTime}
            displayTz={displayTz}
            onSaveBattle={async (battle) => {
              const nowStr = new Date().toISOString();
              const isNew = !battle.id;
              
              const payload: any = {
                ...battle,
                updatedAt: nowStr
              };

              if (isNew) {
                payload.id = `battle_${Date.now()}`;
                payload.createdAt = nowStr;
              }

              const url = isNew ? "/api/battles" : `/api/battles/${payload.id}`;
              const method = isNew ? "POST" : "PUT";

              try {
                const res = await apiFetch(url, {
                  method,
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload)
                });
                if (res.ok) {
                  const updatedDataStr = await apiFetch("/api/battles").then(r => r.json());
                  setBattles(updatedDataStr);
                }
              } catch (err) {
                console.error("Failed to save battle", err);
              }
            }}
            onDeleteBattle={async (id) => {
              try {
                const res = await apiFetch(`/api/battles/${id}`, { method: "DELETE" });
                if (res.ok) {
                  setBattles(battles.filter(b => b.id !== id));
                }
              } catch (err) {
                console.error("Failed to delete battle", err);
              }
            }}
          />
          </motion.div>
        ) : activeTab === "audit" ? (
          <motion.div 
            key="audit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <AuditLogViewer logs={auditLogs} displayTz={displayTz} />
          </motion.div>
        ) : null}
        </AnimatePresence>
      </main>

      {/* Manual creation / update Form Modal */}
      {isFormOpen && (
        <AltarForm 
          altar={editingAltar}
          onSave={handleSaveAltar}
          onClose={() => {
            setIsFormOpen(false);
            setEditingAltar(null);
          }}
        />
      )}

      {/* Clipboard Chat log Bulk populator Drawer/Modal */}
      {isImportOpen && (
        <QuickImporter 
          onImport={handleBulkImport}
          onClose={() => setIsImportOpen(false)}
        />
      )}

      {/* Static descriptive Footer */}
      <footer className="mt-16 h-12 bg-[#0c0c0e] border-t border-[#27272a] px-8 flex items-center justify-between text-[10px] text-[#3f3f46] font-mono">
        <div>STATUS: OPERACIONAL_GRID_SYNCED</div>
        <div className="hidden sm:block">SISTEMA REY DE ALTARES • COORDINACIÓN ESTRATÉGICA DE ALIANZA</div>
        <div>REGISTRY_V1.05_ALTAR</div>
      </footer>
    </div>
  );
}
