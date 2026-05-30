export interface Altar {
  id: string;
  name: string;
  level: number;
  effect: string;
  neighbors: string[];
  occupiedBy: string;
  protectionTimeInput: string; // e.g., "1d 03:50 H" or "2d 03:52 HORAS"
  protectionExpiresAt: string | null; // ISO Timestamp or null
  createdAt: string; // ISO Timestamp
  updatedAt: string; // ISO Timestamp
  notes?: string;
  x?: number;
  y?: number;
}

export interface AllianceStat {
  alliance: string;
  count: number;
  color: string;
  bonuses: string[];
}

export interface Battle {
  id: string;
  altarId: string;
  startTime: string; // ISO Timestamp
  attackingAlliance: string;
  defendingAlliance: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string; // ISO Timestamp
  updatedAt: string; // ISO Timestamp
}

export interface AuditLog {
  id: string;
  altarId: string;
  altarName?: string;
  previousOccupant: string;
  newOccupant: string;
  timestamp: string; 
  player?: string;
  alliance?: string;
  action?: string;
  details?: string;
}
