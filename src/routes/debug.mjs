// src/routes/debug.mjs
import { Router } from "express";
import * as mg from "../db/mongoose.mjs";

// беремо той самий singleton, незалежно від типу імпорту
const mongoose = mg.default || mg.mongoose || mg;

export const debugRouter = Router();

debugRouter.get("/debug/ping", (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

debugRouter.get("/debug/mongoose", async (req, res) => {
  try {
    const ready = mongoose.connection?.readyState ?? null;
    const name =
      mongoose.connection?.name ||
      mongoose.connection?.db?.databaseName ||
      null;
    const version = mongoose.version ?? null;

    // modelNames існує у реальному mongoose; захищаємося на всяк випадок
    const names =
      typeof mongoose.modelNames === "function" ? mongoose.modelNames() : [];

    const hasCurated =
      !!mongoose.models?.CuratedCatalog &&
      typeof mongoose.models.CuratedCatalog.findOne === "function";

    const hasDump =
      !!mongoose.models?.BambooDump &&
      typeof mongoose.models.BambooDump.findOne === "function";

    res.json({
      ok: true,
      runtime: {
        connectionReadyState: ready,
        dbName: name,
        version,
      },
      registeredModels: names,
      curatedCatalog: {
        registered: !!mongoose.models?.CuratedCatalog,
        hasFindOne: hasCurated,
      },
      bambooDump: {
        registered: !!mongoose.models?.BambooDump,
        hasFindOne: hasDump,
      },
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

