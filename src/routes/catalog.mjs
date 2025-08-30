import express from "express";
import { getCatalog, refreshCatalog, getCatalogStatus } from "../catalog/catalogService.mjs";

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

// Примусовий рефреш (діагностика/адмін). За замовчуванням шанує TTL; з ?force=1 ігнорує.
catalogRouter.post("/diag/bamboo/refresh", async (req, res) => {
  try {
    const force = String(req.query.force || "") === "1";
    const doc = await refreshCatalog({ force });
    res.json({
      ok: true,
      source: doc.source,
      updatedAt: doc.updatedAt,
      count: doc.items?.length || 0,
      meta: doc.meta,
    });
  } catch (e) {
    res.status(200).json({ ok: false, error: e?.message || "refresh failed" });
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

