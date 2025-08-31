import express from "express";
import BambooDump from "../models/BambooDump.mjs";
import CuratedCatalog from "../models/CuratedCatalog.mjs";

export const curatedRouter = express.Router();

/** Ключові слова → категорії/лейбли брендів */
const BRAND_MAP = [
  // Gaming
  { key: "gaming", label: "PlayStation", match: /playstation|psn|ps[\s-]?store/i },
  { key: "gaming", label: "Xbox",       match: /xbox|microsoft xbox/i },
  { key: "gaming", label: "Nintendo",   match: /nintendo/i },
  { key: "gaming", label: "Steam",      match: /steam/i },
  // Streaming
  { key: "streaming", label: "Twitch",  match: /twitch/i },
  // Shopping
  { key: "shopping", label: "Amazon",   match: /\bamazon\b/i },
  { key: "shopping", label: "eBay",     match: /\bebay\b/i },
  { key: "shopping", label: "Zalando",  match: /zalando/i },
  // Music
  { key: "music", label: "Spotify",     match: /spotify/i },
  { key: "music", label: "Google Play", match: /google\s*play|google\s*gift/i },
  { key: "music", label: "Apple",       match: /\bapple\b|itunes/i },
  // Food & Drink
  { key: "food", label: "Starbucks",    match: /starbucks/i },
  { key: "food", label: "Uber Eats",    match: /uber\s*eats/i },
  // Travel
  { key: "travel", label: "Airbnb",     match: /airbnb/i },
  { key: "travel", label: "Uber",       match: /^uber$/i },
];

const CATEGORY_KEYS = ["gaming", "streaming", "shopping", "music", "food", "travel"];

/** Нормалізація продукту під фронт */
function normalizeProduct(brand, p) {
  // Формати у v2 можуть відрізнятись — страхуємося опціональностями
  const priceMin = p?.price?.min ?? p?.priceMin ?? p?.minFaceValue ?? null;
  const priceMax = p?.price?.max ?? p?.priceMax ?? p?.maxFaceValue ?? null;
  const currency = p?.price?.currencyCode ?? p?.currencyCode ?? brand?.currencyCode ?? null;

  return {
    id: p?.id ?? p?.productId ?? null,
    name: p?.name || brand?.name || "",
    brandId: brand?.brandId ?? brand?.id ?? null,
    brandName: brand?.name || "",
    countryCode: brand?.countryCode || null,
    currencyCode: currency,
    price: {
      min: Number.isFinite(+priceMin) ? +priceMin : null,
      max: Number.isFinite(+priceMax) ? +priceMax : null,
    },
    modifiedDate: p?.modifiedDate || brand?.modifiedDate || null,
    logoUrl: brand?.logoUrl || null,
  };
}

/** Побудова всіх категорій з дампу */
function buildCurated(rows, wantedCurrencies = []) {
  const res = {
    gaming:    { items: [], count: 0, currencies: [] },
    streaming: { items: [], count: 0, currencies: [] },
    shopping:  { items: [], count: 0, currencies: [] },
    music:     { items: [], count: 0, currencies: [] },
    food:      { items: [], count: 0, currencies: [] },
    travel:    { items: [], count: 0, currencies: [] },
  };

  for (const brand of rows || []) {
    const name = brand?.name || "";
    const hit = BRAND_MAP.find((b) => b.match.test(name));
    if (!hit) continue;

    const products = Array.isArray(brand?.products) ? brand.products : [];
    for (const p of products) {
      const np = normalizeProduct(brand, p);
      if (!np.id) continue;

      // Валютний фільтр (необов'язковий)
      if (Array.isArray(wantedCurrencies) && wantedCurrencies.length > 0) {
        if (np.currencyCode && !wantedCurrencies.includes(np.currencyCode)) continue;
      }

      res[hit.key].items.push(np);
    }
  }

  // Підрахунок та множини валют
  for (const k of CATEGORY_KEYS) {
    const curSet = new Set();
    for (const it of res[k].items) if (it.currencyCode) curSet.add(it.currencyCode);
    res[k].currencies = Array.from(curSet);
    res[k].count = res[k].items.length;
  }

  return res;
}

/** GET /api/curated/refresh?currencies=USD,EUR,CAD,AUD&dumpKey=... */
curatedRouter.get("/curated/refresh", async (req, res) => {
  try {
    const currencies = String(req.query.currencies || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const dumpKey =
      String(req.query.dumpKey || "") ||
      `catalog:v2:ps${Number(process.env.CATALOG_PAGE_SIZE || 100)}:mp${Number(process.env.CATALOG_MAX_PAGES || 30)}`;

    const dump = await BambooDump.findOne({ key: dumpKey }).lean();
    if (!dump) {
      return res.status(404).json({
        ok: false,
        error: `Dump not found for key=${dumpKey}. Спочатку виконай /api/bamboo/export.json?force=1`,
      });
    }

    const curated = buildCurated(dump.rows, currencies);

    // Зберігаємо кожну категорію окремо
    const ops = [];
    for (const k of CATEGORY_KEYS) {
      ops.push(
        CuratedCatalog.updateOne(
          { key: k },
          { $set: { key: k, data: curated[k], updatedAt: new Date() } },
          { upsert: true }
        )
      );
    }
    await Promise.all(ops);

    res.json({ ok: true, currencies, keys: CATEGORY_KEYS, dumpKey, counts: Object.fromEntries(CATEGORY_KEYS.map(k => [k, curated[k].count])) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

/** GET /api/curated/:key  (key ∈ gaming|streaming|shopping|music|food|travel) */
curatedRouter.get("/curated/:key", async (req, res) => {
  try {
    const key = String(req.params.key || "").toLowerCase();
    if (!CATEGORY_KEYS.includes(key)) {
      return res.status(400).json({ ok: false, error: `Unknown category key: ${key}` });
    }
    const doc = await CuratedCatalog.findOne({ key }).lean();
    if (!doc) return res.json({ ok: true, key, data: { items: [], currencies: [], count: 0 } });
    res.json({ ok: true, key, data: doc.data, updatedAt: doc.updatedAt });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

/** Статус кешу */
curatedRouter.get("/curated/status", async (_req, res) => {
  try {
    const docs = await CuratedCatalog.find({}).select({ key: 1, updatedAt: 1, "data.count": 1 }).lean();
    res.json({ ok: true, items: docs || [] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

export default curatedRouter;
