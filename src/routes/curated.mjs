import express from "express";
import { getCuratedFromCache, refreshCuratedNow } from "../catalog/cache.mjs";
import CuratedCatalog from "../models/CuratedCatalog.mjs"; // для status

export const curatedRouter = express.Router();

const split = (s) => String(s || "").split(",").map(x => x.trim()).filter(Boolean);

// GET /api/curated — читаємо з кешу (оновлення у фоні при TTL)
curatedRouter.get("/curated", async (req, res) => {
  try {
    const countries = req.query.countries ? split(req.query.countries) : undefined;
    const currencies = req.query.currencies ? split(req.query.currencies) : undefined;
    const out = await getCuratedFromCache({ countries, currencies, force: false });
    res.json({ ok: true, ...out });
  } catch (e) {
    res.status(200).json({ ok: false, error: e?.message || "failed" });
  }
});

// POST /api/curated/refresh — лишаємо як було
curatedRouter.post("/curated/refresh", async (req, res) => {
  try {
    const countries = req.query.countries ? split(req.query.countries) : undefined;
    const currencies = req.query.currencies ? split(req.query.currencies) : undefined;
    const out = await refreshCuratedNow({ countries, currencies });
    res.json({ ok: true, ...out });
  } catch (e) {
    res.status(200).json({ ok: false, error: e?.message || "refresh failed" });
  }
});

// ✅ ДОДАТИ GET-АЛІАС, бо користувач викликає з браузера GET
curatedRouter.get("/curated/refresh", async (req, res) => {
  try {
    const countries = req.query.countries ? split(req.query.countries) : undefined;
    const currencies = req.query.currencies ? split(req.query.currencies) : undefined;
    const out = await refreshCuratedNow({ countries, currencies });
    res.json({ ok: true, ...out, method: "GET" });
  } catch (e) {
    res.status(200).json({ ok: false, error: e?.message || "refresh failed" });
  }
});

// GET /api/curated/gaming — з кешу
curatedRouter.get("/curated/gaming", async (_req, res) => {
  try {
    const out = await getCuratedFromCache({});
    const gaming = out.data?.categories?.gaming || [];
    res.json({ ok: true, count: gaming.length, items: gaming, meta: out.data?.meta, source: out.source });
  } catch (e) {
    res.status(200).json({ ok: false, error: e?.message || "failed" });
  }
});

// ✅ ДОДАТИ діагностику: чи є документ у БД і коли оновлено
curatedRouter.get("/curated/status", async (_req, res) => {
  try {
    const doc = await CuratedCatalog.findOne({ key: "curated:v1" }).lean();
    res.json({
      ok: true,
      hasDoc: !!doc,
      updatedAt: doc?.updatedAt || null,
      keys: doc ? Object.keys(doc?.data?.categories || {}) : [],
      meta: doc?.data?.meta || null,
    });
  } catch (e) {
    res.status(200).json({ ok: false, error: e?.message || "status failed" });
  }
});

