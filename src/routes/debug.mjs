import express from "express";
import mongoose from "mongoose";
import CuratedCatalog from "../models/CuratedCatalog.mjs"; // перевіряємо сам імпорт

export const debugRouter = express.Router();

debugRouter.get("/debug/mongoose", async (_req, res) => {
  try {
    const names = mongoose.modelNames();            // зареєстровані моделі
    const typeOfModel = typeof CuratedCatalog;      // має бути "function"
    const protoKeys = CuratedCatalog ? Object.getOwnPropertyNames(CuratedCatalog) : [];
    res.json({
      ok: true,
      connected: !!mongoose.connection?.readyState,
      db: mongoose.connection?.name || null,
      modelNames: names,
      curatedCatalog: {
        typeof: typeOfModel,
        hasFindOne: !!CuratedCatalog?.findOne,
        keys: protoKeys.slice(0, 10),
      },
    });
  } catch (e) {
    res.json({ ok: false, error: e?.message || String(e) });
  }
});
