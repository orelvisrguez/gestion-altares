import { Altar } from "../types";

/**
 * Parses protection time inputs like:
 * "1d 03:50 H" -> Days, Hours, Minutes
 * "2d 03:52 HORAS"
 * "10:29 HORAS" -> Hours, Minutes
 * "01:06 HORAS"
 * returns milliseconds duration or null
 */
export function parseRelativeTimeToMs(input: string): number | null {
  if (!input || input.trim() === "") return null;

  const text = input.toLowerCase().trim();

  // Reset counters
  let days = 0;
  let hours = 0;
  let minutes = 0;

  // Pattern 1: Xd YY:ZZ (e.g., "1d 03:50 H" or "2d 03:52 horas")
  const dayTimeRegex = /(\d+)\s*d\s*(\d+)[:hH](\d+)/i;
  // Pattern 2: XX:YY (e.g., "10:29 HORAS" or "01:06")
  const hourMinRegex = /(\d+)[:hH](\d+)/;
  // Pattern 3: just days (e.g. "3d")
  const daysOnlyRegex = /(\d+)\s*d/;
  // Pattern 4: just hours (e.g. "5h")
  const hoursOnlyRegex = /(\d+)\s*h/;

  if (dayTimeRegex.test(text)) {
    const match = text.match(dayTimeRegex);
    if (match) {
      days = parseInt(match[1], 10);
      hours = parseInt(match[2], 10);
      minutes = parseInt(match[3], 10);
    }
  } else if (hourMinRegex.test(text)) {
    const match = text.match(hourMinRegex);
    if (match) {
      hours = parseInt(match[1], 10);
      minutes = parseInt(match[2], 10);
    }
  } else if (daysOnlyRegex.test(text)) {
    const match = text.match(daysOnlyRegex);
    if (match) days = parseInt(match[1], 10);
  } else if (hoursOnlyRegex.test(text)) {
    const match = text.match(hoursOnlyRegex);
    if (match) hours = parseInt(match[1], 10);
  } else {
    // Try checking if there is a flat number of hours or minutes
    const digits = text.replace(/[^\d]/g, "");
    if (digits.length > 0) {
      const num = parseInt(digits, 10);
      if (text.includes("dia") || text.includes("day")) {
        days = num;
      } else if (text.includes("min")) {
        minutes = num;
      } else {
        hours = num;
      }
    } else {
      return null;
    }
  }

  const totalMs = (days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60) * 1000;
  return totalMs > 0 ? totalMs : null;
}

/**
 * Calculates when standard protection expires based on current time
 */
export function calculateExpiration(input: string, referenceDate: Date = new Date()): string | null {
  const ms = parseRelativeTimeToMs(input);
  if (ms === null) return null;
  return new Date(referenceDate.getTime() + ms).toISOString();
}

/**
 * Formats standard milliseconds into human-readable string like "1d 03h 50m" or "01h 06m"
 */
export function formatRemainingTime(ms: number): string {
  if (ms <= 0) return "VULNERABLE / EXPIRADO";

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor((totalSeconds / 60) % 60);
  const hours = Math.floor((totalSeconds / 3600) % 24);
  const days = Math.floor(totalSeconds / 86400);

  const parts: string[] = [];
  if (days > 0) {
    parts.push(`${days}d`);
  }
  
  // Always pad hours and minutes to look uniform, e.g. 03h 05m
  const paddedHours = hours.toString().padStart(2, "0");
  const paddedMinutes = minutes.toString().padStart(2, "0");
  parts.push(`${paddedHours}h`);
  parts.push(`${paddedMinutes}m`);

  return parts.join(" ");
}

/**
 * Parses user copy-pasted block text of Outposts
 */
export function parsePastedOutposts(text: string): Partial<Altar>[] {
  const lines = text.split("\n");
  const parsedRecords: Partial<Altar>[] = [];
  let currentRecord: Partial<Altar> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // A record usually starts with "-" or "." or standard listing
    if (line.startsWith("-") || line.startsWith("*") || line.match(/^\d+[\s.)-]/)) {
      if (currentRecord && currentRecord.name) {
        parsedRecords.push(currentRecord);
      }

      // Start new record
      // Clean leading listing character
      const cleanLine = line.replace(/^[-*+\d.\s]+/, "").trim();
      
      // Try to parse name and level
      let name = cleanLine;
      let level = 1;
      const levelMatch = cleanLine.match(/Nivel\s*(\d+)/i) || cleanLine.match(/Level\s*(\d+)/i) || cleanLine.match(/Nv\s*(\d+)/i);
      if (levelMatch) {
         level = parseInt(levelMatch[1], 10);
         // Clean level suffix from clean name to keep display neat, or keep it. Let's keep it but extract level.
      }

      currentRecord = {
        name,
        level,
        neighbors: [],
        occupiedBy: "DESCONOCIDO",
        protectionTimeInput: "",
        protectionExpiresAt: null,
        effect: "Efecto no especificado"
      };
    } else if (currentRecord) {
      const lowerLine = line.toLowerCase();

      if (lowerLine.startsWith("vecinos:") || lowerLine.includes("vecino")) {
        const value = line.split(/vecinos:/i)[1] || line.split(/vecino[s]?\s*[:\-]/i)[1] || "";
        currentRecord.neighbors = value
          .split(/[\s,;\-]+/)
          .map(v => v.trim().toUpperCase())
          .filter(v => v.length > 0 && v !== "Y");
      } else if (lowerLine.startsWith("ocupado por:") || lowerLine.startsWith("ocupado:") || lowerLine.includes("ocupante") || lowerLine.includes("ocupado por")) {
        const value = line.split(/ocupado por:/i)[1] || line.split(/ocupado[s]?\s*[:\-]/i)[1] || line.split(/ocupado por/i)[1] || "";
        currentRecord.occupiedBy = value.replace(/[.\s]+/g, " ").trim().toUpperCase();
      } else if (lowerLine.includes("tiempo de protecci") || lowerLine.includes("tiempo de proteccion") || lowerLine.includes("proteccion") || lowerLine.includes("protección")) {
        const value = line.split(/protecci[oó]n:/i)[1] || line.split(/tiempo de protecci[oó]n:/i)[1] || line.split(/proteccion/i)[1] || "";
        const rawTime = value.replace(/^[:\s]+/, "").trim();
        currentRecord.protectionTimeInput = rawTime;
        currentRecord.protectionExpiresAt = calculateExpiration(rawTime);
      } else {
        // Must be the effect line (e.g. Velocidad de Construcción +5.0%)
        if (currentRecord.effect === "Efecto no especificado" || !currentRecord.effect) {
          currentRecord.effect = line;
        } else {
          // Append as extra notes or effect
          currentRecord.effect += ` ${line}`;
        }
      }
    }
  }

  // Push the final record
  if (currentRecord && currentRecord.name) {
    parsedRecords.push(currentRecord);
  }

  return parsedRecords;
}

export const INITIAL_ALTAR_PRESETS: Altar[] = [
  {
    id: "1",
    name: "Gremio de Constructores Nivel 1",
    level: 1,
    effect: "Velocidad de Construcción +5.0%",
    neighbors: ["UNR", "LTS", "LAT"],
    occupiedBy: "LTS",
    protectionTimeInput: "1d 03:50 H",
    protectionExpiresAt: calculateExpiration("1d 03:50 H"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "2",
    name: "Arboleda del Recolector Nivel 1",
    level: 1,
    effect: "Velocidad de Recolección de Recursos +5.0%",
    neighbors: ["TDS", "AGE"],
    occupiedBy: "LTS",
    protectionTimeInput: "2d 03:52 HORAS",
    protectionExpiresAt: calculateExpiration("2d 03:52 HORAS"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "3",
    name: "Armeria Nivel 2",
    level: 2,
    effect: "Defensa de Escuadrones: +5.0%",
    neighbors: ["LAT", "AGE", "TDS", "LTS"],
    occupiedBy: "LTS",
    protectionTimeInput: "2d 03:52 HORAS",
    protectionExpiresAt: calculateExpiration("2d 03:52 HORAS"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "4",
    name: "Campamento de Entrenamiento Nivel 2",
    level: 2,
    effect: "Velocidad de Entrenamiento: +5.0%",
    neighbors: ["TDS", "LTS"],
    occupiedBy: "TDS",
    protectionTimeInput: "01:06 HORAS",
    protectionExpiresAt: calculateExpiration("01:06 HORAS"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "5",
    name: "Torre de Erudito Nivel 1",
    level: 1,
    effect: "Velocidad de Investigación: +5.0%",
    neighbors: ["UNR", "LTS", "LAT"],
    occupiedBy: "LAT",
    protectionTimeInput: "01:06 HORAS",
    protectionExpiresAt: calculateExpiration("01:06 HORAS"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "6",
    name: "Arboleda del Recolector Nivel 1",
    level: 1,
    effect: "Velocidad de Recolección de Recursos +5.0%",
    neighbors: ["UNR", "LAT", "rNV", "LTS", "XPR"],
    occupiedBy: "UNR",
    protectionTimeInput: "10:29 HORAS",
    protectionExpiresAt: calculateExpiration("10:29 HORAS"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "7",
    name: "Arsenal Nivel 2",
    level: 2,
    effect: "Ataque de Escuadrones: +5.0%",
    neighbors: ["LTS", "TDS", "UNR"],
    occupiedBy: "UNR",
    protectionTimeInput: "1d 22:12 HORAS",
    protectionExpiresAt: calculateExpiration("1d 22:12 HORAS"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "8",
    name: "Altar de la Cosecha Nivel 1",
    level: 1,
    effect: "Velocidad de Produccion de Recursos: +5.0%",
    neighbors: ["UNR", "LTS", "TDS"],
    occupiedBy: "UNR",
    protectionTimeInput: "2d 22:30 HORAS",
    protectionExpiresAt: calculateExpiration("2d 22:30 HORAS"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "9",
    name: "Torre de Erudito Nivel 3",
    level: 3,
    effect: "Velocidad de Investigación: +8.0%",
    neighbors: ["UNR", "LAT", "LTS"],
    occupiedBy: "UNR",
    protectionTimeInput: "01:06 HORAS",
    protectionExpiresAt: calculateExpiration("01:06 HORAS"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "10",
    name: "Gremio del Constructor Nivel 1",
    level: 1,
    effect: "Velocidad de Construccion: +5.0%",
    neighbors: ["AGE", "TDS", "LTS"],
    occupiedBy: "TDS",
    protectionTimeInput: "01:06 HORAS",
    protectionExpiresAt: calculateExpiration("01:06 HORAS"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
