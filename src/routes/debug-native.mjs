// src/routes/debug-native.mjs
import { Router } from "express";
import mongoose from "mongoose";
import { getNativeDb } from "../db/mongoose.mjs";

export const debugNativeRouter = Router();

debugNativeRouter.get("/debug/native", (req, res) => {
  const conn = mongoose.connection;
  try {
    const db = getNativeDb();
    return res.json({
      ok: true,
      readyState: conn?.readyState ?? null,
      dbName: conn?.name ?? null,
      hasDb: !!db,
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      readyState: conn?.readyState ?? null,
      dbName: conn?.name ?? null,
      error: e?.message || String(e),
    });
  }
});
