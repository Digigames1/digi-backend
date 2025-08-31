import express from "express";
import { getCuratedFromCache, refreshCuratedNow } from "../catalog/cache.mjs";

export const curatedRouter = express.Router();

const split = (s) => String(s || "").split(",").map(x => x.trim()).filter(Boolean);

// GET /api/curated — тільки кеш; якщо треба — фонове оновлення
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

// POST /api/curated/refresh — ручне оновлення кешу
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

// GET /api/curated/gaming — тільки кеш
curatedRouter.get("/curated/gaming", async (_req, res) => {
  try {
    const out = await getCuratedFromCache({});
    const gaming = out.data?.categories?.gaming || [];
    res.json({ ok: true, count: gaming.length, items: gaming, meta: out.data?.meta, source: out.source });
  } catch (e) {
    res.status(200).json({ ok: false, error: e?.message || "failed" });
  }
});
