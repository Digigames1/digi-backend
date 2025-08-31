import express from "express";
import CuratedCatalog from "../models/CuratedCatalog.mjs";
import { fetchMatrix } from "../catalog/bambooMatrix.mjs";

export const curatedRouter = express.Router();

const TTL_MIN = Math.max(5, Number(process.env.CATALOG_TTL_MIN || 60));
const KEY = "curated:v1";

// простий глобальний лок, аби не запускати паралельні фетчі
let refreshing = null;
let lastErr = null;

async function buildAndCache({ countries, currencies }) {
  const { categories, meta } = await fetchMatrix({ countries, currencies });
  const data = { categories, meta, updatedAt: new Date().toISOString() };
  await CuratedCatalog.updateOne(
    { key: KEY },
    { $set: { data, updatedAt: new Date() } },
    { upsert: true }
  );
  return data;
}

async function ensureFresh({ countries, currencies, force = false }) {
  const doc = await CuratedCatalog.findOne({ key: KEY }).lean();
  const fresh =
    doc && Date.now() - new Date(doc.updatedAt).getTime() < TTL_MIN * 60 * 1000;

  if (!force && fresh) return doc.data;

  // якщо вже триває оновлення — чекаємо існуючий проміс
  if (refreshing) {
    try {
      await refreshing;
    } catch (_) {}
    const again = await CuratedCatalog.findOne({ key: KEY }).lean();
    return again?.data || doc?.data || { categories: {}, meta: {} };
  }

  // стартуємо оновлення
  refreshing = buildAndCache({ countries, currencies })
    .then((data) => {
      lastErr = null;
      return data;
    })
    .catch((e) => {
      lastErr = e;
      // на фатальній помилці повертаємо попередній кеш (якщо він був)
      return doc?.data || { categories: {}, meta: {}, error: e?.message || "refresh failed" };
    })
    .finally(() => {
      refreshing = null;
    });

  return refreshing;
}

// === API ===

// GET /api/curated — віддає з кешу (оновлює лише за TTL)
curatedRouter.get("/curated", async (req, res) => {
  try {
    const split = (s) =>
      String(s || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
    const countries = req.query.countries ? split(req.query.countries) : undefined;
    const currencies = req.query.currencies ? split(req.query.currencies) : undefined;

    const data = await ensureFresh({ countries, currencies, force: false });
    res.json({ ok: true, ...data, lastErr: lastErr ? String(lastErr) : null });
  } catch (e) {
    res.status(200).json({ ok: false, error: e?.response?.data || e?.message || "failed" });
  }
});

// POST /api/curated/refresh — явне оновлення кешу (1 раз, під локом)
curatedRouter.post("/curated/refresh", async (req, res) => {
  try {
    const split = (s) =>
      String(s || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
    const countries = req.query.countries ? split(req.query.countries) : undefined;
    const currencies = req.query.currencies ? split(req.query.currencies) : undefined;

    const data = await ensureFresh({ countries, currencies, force: true });
    const gamingCount = (data.categories?.gaming || []).length;
    res.json({ ok: true, refreshed: true, gamingCount, meta: data.meta });
  } catch (e) {
    // навіть при помилці (наприклад, 429) віддаємо останній кеш
    const doc = await CuratedCatalog.findOne({ key: KEY }).lean();
    res.status(200).json({
      ok: false,
      error: e?.response?.data || e?.message || "refresh failed",
      cached: !!doc,
      cachedUpdatedAt: doc?.updatedAt || null,
    });
  }
});

// GET /api/curated/gaming — ТІЛЬКИ з кешу (жодних прямих звернень до Bamboo)
curatedRouter.get("/curated/gaming", async (_req, res) => {
  try {
    const doc = await CuratedCatalog.findOne({ key: KEY }).lean();
    if (!doc?.data) {
      // якщо кешу ще не було — підказуємо викликати refresh один раз
      return res.status(200).json({
        ok: false,
        error: "Cache empty. Call POST /api/curated/refresh once, then retry.",
      });
    }
    const gaming = doc.data.categories?.gaming || [];
    res.json({
      ok: true,
      count: gaming.length,
      items: gaming,
      meta: doc.data.meta,
      updatedAt: doc.updatedAt,
      lastErr: lastErr ? String(lastErr) : null,
    });
  } catch (e) {
    res.status(200).json({ ok: false, error: e?.message || "failed" });
  }
});
