import express from "express";
import mongoose from "mongoose";

// Імпортуємо моделі обома способами — default і named.
// Завдяки попередньому патчу моделі мають подвійний експорт.
import CuratedCatalog, { CuratedCatalog as CuratedCatalogNamed } from "../models/CuratedCatalog.mjs";
import BambooDump, { BambooDump as BambooDumpNamed } from "../models/BambooDump.mjs";

export const debugRouter = express.Router();

function getMongooseRuntime() {
  // Деякі бандли прокидають mongoose у default, деякі — напряму.
  const mg = mongoose?.model ? mongoose : (mongoose?.default || mongoose);
  const conn = mg?.connection || null;
  // Безпечне отримання назв моделей (не через modelNames()):
  const modelsObj = (conn?.models && Object.keys(conn.models).length ? conn.models : mg?.models) || {};
  const modelNames = Object.keys(modelsObj);
  return { mg, conn, modelsObj, modelNames };
}

function inspectModel(m) {
  return {
    typeof: typeof m,
    hasFindOne: !!m?.findOne,
    hasUpdateOne: !!m?.updateOne,
    isFunction: typeof m === "function",
    keys: m ? Object.getOwnPropertyNames(m).slice(0, 20) : [],
  };
}

debugRouter.get("/debug/mongoose", async (_req, res) => {
  try {
    const { mg, conn, modelsObj, modelNames } = getMongooseRuntime();
    res.json({
      ok: true,
      runtime: {
        hasModel: !!mg?.model,
        hasModels: !!mg?.models,
        connectionReadyState: conn?.readyState ?? null,
        dbName: conn?.name ?? null,
      },
      registeredModels: modelNames,
      curatedCatalog: {
        default: inspectModel(CuratedCatalog),
        named: inspectModel(CuratedCatalogNamed),
      },
      bambooDump: {
        default: inspectModel(BambooDump),
        named: inspectModel(BambooDumpNamed),
      },
    });
  } catch (e) {
    res.json({ ok: false, error: e?.message || String(e) });
  }
});

// Мінімальний пінг, щоб перевіряти підключення роутера
debugRouter.get("/debug/ping", (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});
