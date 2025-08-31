import express from "express";
import mongoose from "mongoose";
import CuratedCatalog, { CuratedCatalog as CuratedCatalogNamed } from "../models/CuratedCatalog.mjs";
import BambooDump, { BambooDump as BambooDumpNamed } from "../models/BambooDump.mjs";

export const debugRouter = express.Router();

debugRouter.get("/debug/mongoose", async (_req, res) => {
  try {
    const names = mongoose.modelNames();
    res.json({
      ok: true,
      connected: mongoose.connection?.readyState,
      db: mongoose.connection?.name || null,
      modelNames: names,
      curatedCatalog: {
        typeofDefault: typeof CuratedCatalog,
        hasFindOneDefault: !!CuratedCatalog?.findOne,
        typeofNamed: typeof CuratedCatalogNamed,
        hasFindOneNamed: !!CuratedCatalogNamed?.findOne,
      },
      bambooDump: {
        typeofDefault: typeof BambooDump,
        hasUpdateOneDefault: !!BambooDump?.updateOne,
        typeofNamed: typeof BambooDumpNamed,
        hasUpdateOneNamed: !!BambooDumpNamed?.updateOne,
      },
    });
  } catch (e) {
    res.json({ ok: false, error: e?.message || String(e) });
  }
});
