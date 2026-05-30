import "dotenv/config";
import express from "express";
import path from "path";
import { createClient } from "@libsql/client";

const dbUrl = process.env.TURSO_DATABASE_URL || "file:local.db";
const dbToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({
  url: dbUrl,
  authToken: dbToken,
});

async function initDB() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS altars (
      id TEXT PRIMARY KEY,
      name TEXT,
      level INTEGER,
      effect TEXT,
      neighbors TEXT,
      occupiedBy TEXT,
      protectionTimeInput TEXT,
      protectionExpiresAt TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      notes TEXT,
      x INTEGER,
      y INTEGER
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS battles (
      id TEXT PRIMARY KEY,
      altarId TEXT,
      startTime TEXT,
      attackingAlliance TEXT,
      defendingAlliance TEXT,
      status TEXT,
      notes TEXT,
      createdAt TEXT,
      updatedAt TEXT
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      altarId TEXT,
      previousOccupant TEXT,
      newOccupant TEXT,
      timestamp TEXT
    )
  `);

  try { await db.execute("ALTER TABLE audit_logs ADD COLUMN player TEXT"); } catch (e) {}
  try { await db.execute("ALTER TABLE audit_logs ADD COLUMN alliance TEXT"); } catch (e) {}
  try { await db.execute("ALTER TABLE audit_logs ADD COLUMN action TEXT"); } catch (e) {}
  try { await db.execute("ALTER TABLE audit_logs ADD COLUMN details TEXT"); } catch (e) {}
  try { await db.execute("ALTER TABLE altars ADD COLUMN x INTEGER"); } catch (e) {}
  try { await db.execute("ALTER TABLE altars ADD COLUMN y INTEGER"); } catch (e) {}
}

async function logAudit(db: any, params: { altarId?: string, action: string, previousOccupant?: string, newOccupant?: string, details?: string, player: string, alliance: string }) {
  try {
    await db.execute({
      sql: `INSERT INTO audit_logs (id, altarId, previousOccupant, newOccupant, timestamp, player, alliance, action, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [`log_${Date.now()}_${Math.random().toString(36).substring(7)}`, params.altarId || null, params.previousOccupant || null, params.newOccupant || null, new Date().toISOString(), params.player, params.alliance, params.action, params.details || null]
    });
  } catch (err) {
    console.error("Failed to insert audit log", err);
  }
}

function getAuthor(req: express.Request) {
  return {
    player: (req.headers["x-player-name"] as string) || "Anónimo",
    alliance: (req.headers["x-player-alliance"] as string) || "Desconocida",
  };
}

// Initialize DB on cold start
let dbInitialized = false;
async function ensureDB() {
  if (!dbInitialized) {
    await initDB();
    dbInitialized = true;
  }
}

// Create Express app
const app = express();
app.use(express.json());

app.get("/api/altars", async (req, res) => {
  await ensureDB();
  try {
    const result = await db.execute("SELECT * FROM altars");
    const altars = result.rows.map(row => ({
      ...row,
      neighbors: JSON.parse(row.neighbors as string || "[]")
    }));
    res.json(altars);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch altars" });
  }
});

app.post("/api/altars", async (req, res) => {
  await ensureDB();
  const { id, name, level, effect, neighbors, occupiedBy, protectionTimeInput, protectionExpiresAt, createdAt, updatedAt, notes, x, y } = req.body;
  const author = getAuthor(req);
  try {
    await db.execute({
      sql: `INSERT INTO altars (id, name, level, effect, neighbors, occupiedBy, protectionTimeInput, protectionExpiresAt, createdAt, updatedAt, notes, x, y) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id || null, name || null, level || null, effect || null, JSON.stringify(neighbors || []), occupiedBy || null, protectionTimeInput || null, protectionExpiresAt || null, createdAt || null, updatedAt || null, notes || "", x || null, y || null
      ]
    });
    
    await logAudit(db, {
      altarId: id,
      action: "CREATE_ALTAR",
      player: author.player,
      alliance: author.alliance,
      details: `Creado altar: ${name}`
    });

    res.status(201).json(req.body);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create altar" });
  }
});

app.put("/api/altars/:id", async (req, res) => {
  await ensureDB();
  const { id } = req.params;
  const { name, level, effect, neighbors, occupiedBy, protectionTimeInput, protectionExpiresAt, updatedAt, notes, x, y } = req.body;
  const author = getAuthor(req);
  try {
    const currentRes = await db.execute({ sql: "SELECT occupiedBy FROM altars WHERE id = ?", args: [id] });
    const currentOccupant = currentRes.rows[0]?.occupiedBy as string;

    await db.execute({
      sql: `UPDATE altars SET 
            name = ?, level = ?, effect = ?, neighbors = ?, occupiedBy = ?, protectionTimeInput = ?, protectionExpiresAt = ?, updatedAt = ?, notes = ?, x = ?, y = ?
            WHERE id = ?`,
      args: [
        name || null, level || null, effect || null, JSON.stringify(neighbors || []), occupiedBy || null, protectionTimeInput || null, protectionExpiresAt || null, updatedAt || null, notes || "", x || null, y || null, id || null
      ]
    });

    let action = "UPDATE_ALTAR";
    if (currentOccupant && currentOccupant !== occupiedBy) {
      action = "OCCUPANT_CHANGE";
    }

    await logAudit(db, {
      altarId: id,
      action,
      previousOccupant: currentOccupant,
      newOccupant: occupiedBy || "LIBRE",
      player: author.player,
      alliance: author.alliance,
      details: `Altar: ${name}`
    });

    res.status(200).json(req.body);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update altar" });
  }
});

app.delete("/api/altars/:id", async (req, res) => {
  await ensureDB();
  const { id } = req.params;
  const author = getAuthor(req);
  try {
    await db.execute({ sql: "DELETE FROM altars WHERE id = ?", args: [id] });
    
    await logAudit(db, {
      altarId: id,
      action: "DELETE_ALTAR",
      player: author.player,
      alliance: author.alliance,
      details: `Altar eliminado`
    });

    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete altar" });
  }
});

app.post("/api/altars/bulk", async (req, res) => {
  await ensureDB();
  const altars = req.body;
  const author = getAuthor(req);
  if (!Array.isArray(altars)) {
    return res.status(400).json({ error: "Require an array of altars for bulk insert" });
  }
  
  try {
    const queries = [{ sql: "DELETE FROM altars", args: [] }];
    
    for (const altar of altars) {
      queries.push({
        sql: `INSERT INTO altars (id, name, level, effect, neighbors, occupiedBy, protectionTimeInput, protectionExpiresAt, createdAt, updatedAt, notes, x, y) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          altar.id || null, altar.name || null, altar.level || null, altar.effect || null, JSON.stringify(altar.neighbors || []), altar.occupiedBy || null, 
          altar.protectionTimeInput || null, altar.protectionExpiresAt || null, altar.createdAt || null, altar.updatedAt || null, altar.notes || "", altar.x || null, altar.y || null
        ]
      });
    }
    
    await db.batch(queries, "write");

    await logAudit(db, {
      action: "BULK_IMPORT_ALTARS",
      player: author.player,
      alliance: author.alliance,
      details: `Importados ${altars.length} altares`
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Bulk upload failed", error);
    res.status(500).json({ error: "Failed to perform bulk upload" });
  }
});

app.get("/api/battles", async (req, res) => {
  await ensureDB();
  try {
    const result = await db.execute("SELECT * FROM battles");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch battles" });
  }
});

app.post("/api/battles", async (req, res) => {
  await ensureDB();
  const { id, altarId, startTime, attackingAlliance, defendingAlliance, status, notes, createdAt, updatedAt } = req.body;
  const author = getAuthor(req);
  try {
    await db.execute({
      sql: `INSERT INTO battles (id, altarId, startTime, attackingAlliance, defendingAlliance, status, notes, createdAt, updatedAt) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id || null, altarId || null, startTime || null, attackingAlliance || null, defendingAlliance || null, status || null, notes || "", createdAt || null, updatedAt || null
      ]
    });

    await logAudit(db, {
      altarId: altarId,
      action: "CREATE_BATTLE",
      player: author.player,
      alliance: author.alliance,
      details: `Batalla planificada vs ${defendingAlliance || "N/A"}`
    });

    res.status(201).json(req.body);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create battle" });
  }
});

app.put("/api/battles/:id", async (req, res) => {
  await ensureDB();
  const { id } = req.params;
  const { altarId, startTime, attackingAlliance, defendingAlliance, status, notes, updatedAt } = req.body;
  const author = getAuthor(req);
  try {
    await db.execute({
      sql: `UPDATE battles SET 
            altarId = ?, startTime = ?, attackingAlliance = ?, defendingAlliance = ?, status = ?, notes = ?, updatedAt = ?
            WHERE id = ?`,
      args: [
        altarId || null, startTime || null, attackingAlliance || null, defendingAlliance || null, status || null, notes || "", updatedAt || null, id || null
      ]
    });

    await logAudit(db, {
      altarId: altarId,
      action: "UPDATE_BATTLE",
      player: author.player,
      alliance: author.alliance,
      details: `Batalla modificada: ${status}`
    });

    res.status(200).json(req.body);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update battle" });
  }
});

app.delete("/api/battles/:id", async (req, res) => {
  await ensureDB();
  const { id } = req.params;
  const author = getAuthor(req);
  try {
    await db.execute({ sql: "DELETE FROM battles WHERE id = ?", args: [id] });

    await logAudit(db, {
      action: "DELETE_BATTLE",
      player: author.player,
      alliance: author.alliance,
      details: `Batalla eliminada`
    });

    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete battle" });
  }
});

app.get("/api/audit_logs", async (req, res) => {
  await ensureDB();
  try {
    const result = await db.execute(`
      SELECT a.id, a.altarId, al.name as altarName, a.previousOccupant, a.newOccupant, a.timestamp, a.player, a.alliance, a.action, a.details 
      FROM audit_logs a 
      LEFT JOIN altars al ON a.altarId = al.id
      ORDER BY a.timestamp DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Export handler for Vercel
export default app;