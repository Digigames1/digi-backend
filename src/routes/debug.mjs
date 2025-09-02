// src/routes/debug.mjs
import express from "express";
import { getMongoose } from "../db/mongoose.mjs";
import { CuratedCatalog } from "../models/CuratedCatalog.mjs";
import { BambooDump } from "../models/BambooDump.mjs";

export const debugRouter = express.Router();

debugRouter.get("/ping", (_, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

debugRouter.get("/mongoose", async (_req, res) => {
  const mongoose = getMongoose();
  const modelNames = typeof mongoose.modelNames === "function"
    ? mongoose.modelNames()
    : [];

  const hasCurated =
    !!CuratedCatalog &&
    typeof CuratedCatalog.findOne === "function" &&
    typeof CuratedCatalog.updateOne === "function";

  const hasDump =
    !!BambooDump &&
    typeof BambooDump.findOne === "function" &&
    typeof BambooDump.updateOne === "function";

  res.json({
    ok: true,
    runtime: {
      connectionReadyState: mongoose.connection?.readyState ?? null,
      dbName:
        mongoose.connection?.name ??
        mongoose.connections?.[0]?.name ??
        null,
      version: mongoose.version ?? null
    },
    modelNames,
    curatedCatalog: { registered: hasCurated },
    bambooDump: { registered: hasDump }
  });
});

// Форс-імпорт (корисно для діагностики кешу/холодного старту)
debugRouter.get("/force-models", (_req, res) => {
  const mongoose = getMongoose();
  const modelNames = typeof mongoose.modelNames === "function"
    ? mongoose.modelNames()
    : [];
  res.json({
    ok: true,
    forced: ["CuratedCatalog", "BambooDump"],
    modelNames
  });
});

