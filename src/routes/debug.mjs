import { Router } from "express";
import * as mg from "../db/mongoose.mjs";

// get the exact same singleton
const mongoose = mg.default || mg.mongoose || mg;

export const debugRouter = Router();

debugRouter.get("/debug/ping", (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// force-load models (in case anything imported routes too early)
debugRouter.get("/debug/force-models", async (_req, res) => {
  try {
    const idx = await import("../models/index.mjs");
    const names = typeof mongoose.modelNames === "function"
      ? mongoose.modelNames()
      : Object.keys(mongoose.models || {});
    res.json({
      ok: true,
      forced: Array.isArray(idx.default) ? idx.default : [],
      modelNames: names,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

debugRouter.get("/debug/mongoose", (_req, res) => {
  try {
    const ready = mongoose.connection?.readyState ?? null;
    const name =
      mongoose.connection?.name ||
      mongoose.connection?.db?.databaseName ||
      null;
    const version = mongoose.version ?? null;
    const names = typeof mongoose.modelNames === "function"
      ? mongoose.modelNames()
      : Object.keys(mongoose.models || {});

    const curated = mongoose.models?.CuratedCatalog;
    const dump = mongoose.models?.BambooDump;

    res.json({
      ok: true,
      runtime: { connectionReadyState: ready, dbName: name, version },
      registeredModels: names,
      curatedCatalog: {
        registered: !!curated,
        hasFindOne: !!curated?.findOne,
        hasUpdateOne: !!curated?.updateOne,
      },
      bambooDump: {
        registered: !!dump,
        hasFindOne: !!dump?.findOne,
        hasUpdateOne: !!dump?.updateOne,
      },
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});
