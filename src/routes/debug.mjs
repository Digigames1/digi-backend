// src/routes/debug.mjs
import express from "express";
import { getMongoose } from "../db/mongoose.mjs";

export const debugRouter = express.Router();

debugRouter.get("/ping", (_, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

debugRouter.get("/wire", async (_req, res) => {
  const m1 = getMongoose();
  const m2 = (await import("mongoose")).default;
  res.json({
    ok: true,
    sameInstance: m1 === m2,
    version: m1?.version ?? null,
    readyState: m1?.connection?.readyState ?? null,
    modelNames:
      typeof m1.modelNames === "function" ? m1.modelNames() : []
  });
});

debugRouter.get("/mongoose", (_req, res) => {
  const mongoose = getMongoose();
  const names =
    typeof mongoose.modelNames === "function" ? mongoose.modelNames() : [];
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
    modelNames: names,
    curatedCatalog: {
      registered: !!names.includes("CuratedCatalog")
    },
    bambooDump: {
      registered: !!names.includes("BambooDump")
    }
  });
});

