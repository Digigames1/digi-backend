import express from "express";
import { getCatalog, getCatalogStatus } from "../catalog/catalogService.mjs";

export const catalogRouter = express.Router();

// Віддати каталог (кеш/свіжі)
catalogRouter.get("/catalog", async (req, res) => {
  try {
    const doc = await getCatalog();
    const notice = doc.source !== "bamboo" ? "Serving cached catalog (Bamboo limited to hourly updates)." : null;
    res.json({
      ok: true,
      source: doc.source,
      updatedAt: doc.updatedAt,
      count: doc.items?.length || 0,
      notice,
      items: doc.items || [],
    });
  } catch (e) {
    res.status(200).json({
      ok: false,
      error: e?.message || "failed",
    });
  }
});

// Статус кешу (без items)
catalogRouter.get("/diag/bamboo/status", async (_req, res) => {
  try {
    const st = await getCatalogStatus();
    res.json({ ok: true, ...st });
  } catch (e) {
    res.status(200).json({ ok: false, error: e?.message || "status failed" });
  }
});

