import express from "express";
import { getMongoose } from "../db/mongoose.mjs";
import CuratedCatalog, { CuratedCatalog as CuratedCatalogNamed } from "../models/CuratedCatalog.mjs";
import BambooDump, { BambooDump as BambooDumpNamed } from "../models/BambooDump.mjs";

export const debugRouter = express.Router();

function inspectModel(m) {
  return {
    typeof: typeof m,
    isFunction: typeof m === "function",
    hasFindOne: !!m?.findOne,
    hasUpdateOne: !!m?.updateOne,
  };
}

debugRouter.get("/debug/mongoose", (_req, res) => {
  try {
    const mg = getMongoose();
    const conn = mg.connection || null;
    const registered = Object.keys((conn?.models && Object.keys(conn.models).length ? conn.models : mg.models) || {});
    res.json({
      ok: true,
      runtime: {
        hasModel: !!mg?.model,
        hasModels: !!mg?.models,
        connectionReadyState: conn?.readyState ?? null, // 1 — підключено
        dbName: conn?.name ?? null,
      },
      registeredModels: registered,
      curatedCatalog: { default: inspectModel(CuratedCatalog), named: inspectModel(CuratedCatalogNamed) },
      bambooDump: { default: inspectModel(BambooDump), named: inspectModel(BambooDumpNamed) },
    });
  } catch (e) {
    res.json({ ok: false, error: e?.message || String(e) });
  }
});

debugRouter.get("/debug/ping", (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));
