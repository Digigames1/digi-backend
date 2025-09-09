// src/routes/debug.mjs
import express from "express";
import { mongoose } from "../db/mongoose.mjs";

export const debugRouter = express.Router();

debugRouter.get("/ping", (_, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

debugRouter.get("/wire", async (_req, res) => {
  const m1 = mongoose;
  const m2 = (await import("mongoose")).default;
  res.json({
    ok: true,
    sameInstance: m1 === m2,
    version: m1?.version ?? null,
    readyState: m1?.connection?.readyState ?? null,
    modelNames: typeof m1.modelNames === "function" ? m1.modelNames() : []
  });
});

debugRouter.get("/mongoose", async (_req, res) => {
  // Ensure models are registered before listing names
  try {
    await import("../models/index.mjs");
  } catch {}
  const names = typeof mongoose.modelNames === "function" ? mongoose.modelNames() : [];
  res.json({
    ok: true,
    runtime: {
      connectionReadyState: mongoose.connection?.readyState ?? null,
      dbName: mongoose.connection?.name ?? null,
      version: mongoose?.version ?? null,
      modelNames: names,
    },
    curatedCatalog: { registered: Boolean(mongoose.models?.CuratedCatalog) },
    bambooDump: { registered: Boolean(mongoose.models?.BambooDump) },
  });
});

