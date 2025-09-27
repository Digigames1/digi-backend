import { Router } from "express";
export const debugEnvRouter = Router();

function mask(v) {
  if (!v) return null;
  if (v.length <= 6) return "***";
  return v.slice(0, 3) + "***" + v.slice(-3);
}

debugEnvRouter.get("/debug/env", (_req, res) => {
  res.json({
    ok: true,
    has: {
      MONGODB_URI: !!process.env.MONGODB_URI,
      DB_URL: !!process.env.DB_URL,
      MONGO_URL: !!process.env.MONGO_URL,
      MONGODB_DB_NAME: !!process.env.MONGODB_DB_NAME,
      DB_NAME: !!process.env.DB_NAME,
    },
    sample: {
      MONGODB_URI: mask(process.env.MONGODB_URI || ""),
      DB_URL: mask(process.env.DB_URL || ""),
    },
    chosen: (process.env.MONGODB_URI && "MONGODB_URI") ||
            (process.env.DB_URL && "DB_URL") ||
            (process.env.MONGO_URL && "MONGO_URL") ||
            null,
    dbName: process.env.MONGODB_DB_NAME || process.env.DB_NAME || null,
  });
});
