import React, { useState, useEffect } from 'react';
import { Clock, Globe } from 'lucide-react';

interface ClockWidgetProps {
  displayTz: string;
  setDisplayTz: (tz: string) => void;
}

export default function ClockWidget({ displayTz, setDisplayTz }: ClockWidgetProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const timezones = [
    { label: 'Local (Auto)', value: Intl.DateTimeFormat().resolvedOptions().timeZone },
    { label: 'UTC (Servidor)', value: 'UTC' },
    { label: 'Buenos Aires (Arg)', value: 'America/Argentina/Buenos_Aires' },
    { label: 'Bogotá (Col)', value: 'America/Bogota' },
    { label: 'Ciudad de México', value: 'America/Mexico_City' },
    { label: 'Santiago (Chi)', value: 'America/Santiago' },
    { label: 'Madrid (Esp)', value: 'Europe/Madrid' },
    { label: 'Riad (Med. Oriente)', value: 'Asia/Riyadh' },
  ];

  return (
    <div className="flex items-center gap-2 sm:gap-3 bg-[#111113] border border-[#27272a] rounded-lg px-2 sm:px-3 py-1 sm:py-1.5">
      <div className="flex flex-col">
        <span className="text-[9px] text-[#a1a1aa] font-bold uppercase tracking-widest leading-none mb-1">
          Servidor (UTC)
        </span>
        <span className="text-[#e4e4e7] font-mono text-xs font-bold leading-none flex items-center gap-1">
          <Clock className="w-3 h-3 text-gold-clan" />
          {time.toLocaleTimeString('en-GB', { timeZone: 'UTC', hour12: false })}
        </span>
      </div>
      
      <div className="w-[1px] h-6 bg-[#27272a]"></div>
      
      <div className="flex flex-col">
        <div className="flex items-center gap-1 mb-1 leading-none">
          <Globe className="w-2.5 h-2.5 text-[#71717a]" />
          <select 
            value={displayTz} 
            onChange={e => setDisplayTz(e.target.value)}
            className="text-[9px] text-[#a1a1aa] bg-transparent border-none outline-none font-bold uppercase tracking-widest cursor-pointer hover:text-white p-0 m-0 leading-none appearance-none"
          >
            {timezones.map(tz => (
              <option key={tz.value} value={tz.value} className="bg-[#18181b]">
                {tz.label}
              </option>
            ))}
          </select>
        </div>
        <span className="text-[#a1a1aa] font-mono text-xs font-bold leading-none border-t border-transparent">
          {time.toLocaleTimeString('en-GB', { timeZone: displayTz, hour12: false })}
        </span>
      </div>
    </div>
  );
}
