import express from "express";
import { getCuratedFromCache, refreshCuratedNow } from "../catalog/cache.mjs";

export const curatedRouter = express.Router();

// GET /api/curated — тільки з кешу; якщо TTL вийшов — тригерне оновлення у фоні
curatedRouter.get("/curated", async (req, res) => {
  try {
    const split = (s) => String(s || "").split(",").map(x => x.trim()).filter(Boolean);
    const countries = req.query.countries ? split(req.query.countries) : undefined;
    const currencies = req.query.currencies ? split(req.query.currencies) : undefined;

    const out = await getCuratedFromCache({ countries, currencies, force: false });
    res.json({ ok: true, ...out });
  } catch (e) {
    res.status(200).json({ ok: false, error: e?.message || "failed" });
  }
});

// POST /api/curated/refresh — примусове оновлення (викликати рідко)
curatedRouter.post("/curated/refresh", async (req, res) => {
  try {
    const split = (s) => String(s || "").split(",").map(x => x.trim()).filter(Boolean);
    const countries = req.query.countries ? split(req.query.countries) : undefined;
    const currencies = req.query.currencies ? split(req.query.currencies) : undefined;

    const out = await refreshCuratedNow({ countries, currencies });
    res.json({ ok: true, ...out });
  } catch (e) {
    res.status(200).json({ ok: false, error: e?.message || "refresh failed" });
  }
});

// GET /api/curated/gaming — тільки з кешу
curatedRouter.get("/curated/gaming", async (_req, res) => {
  try {
    const out = await getCuratedFromCache({});
    const gaming = out.data?.categories?.gaming || [];
    res.json({ ok: true, count: gaming.length, items: gaming, meta: out.data?.meta, source: out.source });
  } catch (e) {
    res.status(200).json({ ok: false, error: e?.message || "failed" });
  }
});

