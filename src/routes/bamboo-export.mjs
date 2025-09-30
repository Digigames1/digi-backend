// src/routes/bamboo-export.mjs
import { Router } from "express";
import { RateLimit } from "../models/RateLimit.mjs";
import { BambooDump } from "../models/BambooDump.mjs";
import { BambooPage } from "../models/BambooPage.mjs";
import { fetchCatalogPageWithRetry } from "../services/bambooClient.mjs";

export const bambooExportRouter = Router();

const RL_KEY = "bamboo:catalog";

// ---------- helpers: picking ----------
function pickString(...values) {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
    if (typeof value === "number" && !Number.isNaN(value)) {
      return String(value);
    }
  }
  return undefined;
}
function pickNumber(...values) {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }
  return undefined;
}
function pickDate(...values) {
  for (const value of values) {
    if (!value) continue;
    if (value instanceof Date) {
      const time = value.getTime?.();
      if (!Number.isNaN(time)) return value;
      continue;
    }
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}

// ---------- keys and mappers for flexible API payloads ----------
const PRODUCT_CONTAINER_KEYS = [
  "products", "Products",
  "catalogItems", "CatalogItems",
  "productList", "ProductList",
];

const PRODUCT_NAME_KEYS = [
  "name", "productName", "title", "displayName", "itemName",
  "Name", "ProductName", "Title", "DisplayName", "ItemName",
];

const BRAND_KEYS = [
  "brand", "brandName", "brand_title", "programBrand", "program", "vendor", "vendorName",
  "Brand", "BrandName", "Brand_title", "ProgramBrand", "Program", "Vendor", "VendorName",
];

const COUNTRY_KEYS = [
  "countryCode", "country", "countryIso", "countryIsoCode", "countryISO", "region",
  "CountryCode", "Country", "CountryIso", "CountryIsoCode", "CountryISO", "Region",
];

const CURRENCY_KEYS = [
  "currencyCode", "currency", "currencyIso", "currencyISO", "priceCurrency",
  "CurrencyCode", "Currency", "CurrencyIso", "CurrencyISO", "PriceCurrency",
];

const MODIFIED_DATE_KEYS = [
  "modifiedDate", "lastModified", "updatedAt", "lastUpdate", "lastUpdateDate",
  "modifiedAt", "updatedOn", "lastModifiedDate",
  "ModifiedDate", "LastModified", "UpdatedAt", "LastUpdate", "LastUpdateDate",
  "ModifiedAt", "UpdatedOn", "LastModifiedDate",
];

function gatherContextValues(contexts, keys) {
  const values = [];
  if (!Array.isArray(contexts)) return values;
  for (let i = contexts.length - 1; i >= 0; i--) {
    const ctx = contexts[i];
    if (!ctx || typeof ctx !== "object") continue;
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(ctx, key)) {
        values.push(ctx[key]);
      }
    }
  }
  return values;
}

function buildProductRecord(node, contexts) {
  if (!node || typeof node !== "object") return null;

  // якщо це "контейнер продуктів" — не трактуємо як одиночний продукт
  for (const key of PRODUCT_CONTAINER_KEYS) {
    const value = node[key];
    if (Array.isArray(value) && value.some((entry) => entry && typeof entry === "object")) {
      return null;
    }
  }

  const idKey = pickString(
    node.id, node.productId, node.productID, node.ProductId,
    node.sku, node.code, node.itemId, node.itemID, node.programProductId
  );
  const productId = pickNumber(
    node.id, node.productId, node.productID, node.ProductId,
    node.sku, node.code, node.itemId, node.itemID, node.programProductId
  );

  const nameKey = pickString(...PRODUCT_NAME_KEYS.map((k) => node[k]));
  const descriptionName = pickString(node.description, node.shortDescription, node.longDescription);

  const brandName =
    pickString(
      ...BRAND_KEYS.map((k) => node[k]),
      ...gatherContextValues(contexts, [...BRAND_KEYS, "name", "title"])
    ) || null;

  const countryCode =
    pickString(...COUNTRY_KEYS.map((k) => node[k]), ...gatherContextValues(contexts, COUNTRY_KEYS)) || null;

  const currencyCode =
    pickString(
      node.currencyCode, node.currency, node.currencyIso, node.currencyISO, node.priceCurrency,
      node.price?.currencyCode, node.price?.currency,
      ...gatherContextValues(contexts, CURRENCY_KEYS)
    ) || null;

  const priceMinRaw = pickNumber(
    node.price?.min, node.priceMin, node.minPrice,
    node.lowestDenomination, node.minDenomination, node.minDenominationValue,
    node.denominationMin, node.denominationLow, node.minimumAmount, node.min
  );

  const priceMaxRaw = pickNumber(
    node.price?.max, node.priceMax, node.maxPrice,
    node.highestDenomination, node.maxDenomination, node.maxDenominationValue,
    node.denominationMax, node.denominationHigh, node.maximumAmount, node.max
  );

  const modifiedDate =
    pickDate(
      ...MODIFIED_DATE_KEYS.map((k) => node[k]),
      ...gatherContextValues(contexts, MODIFIED_DATE_KEYS)
    ) || null;

  const primaryName = nameKey || descriptionName;
  const resolvedName = primaryName || brandName || idKey || null;

  if (!idKey && !primaryName) return null;
  if (!idKey && !(currencyCode || priceMinRaw !== undefined || priceMaxRaw !== undefined)) {
    return null;
  }

  return {
    item: {
      brand: brandName,
      id: productId ?? null,
      name: resolvedName || "Unnamed product",
      countryCode,
      currencyCode,
      priceMin: priceMinRaw ?? null,
      priceMax: priceMaxRaw ?? null,
      modifiedDate,
      raw: node,
    },
    identity: {
      idKey,
      brandName,
      productName: primaryName || resolvedName || null,
    },
  };
}

function createDedupeKey(identity, fallbackIndex) {
  if (identity?.idKey) return `${identity.idKey}#${identity.brandName || ""}`;
  if (identity?.brandName && identity?.productName) {
    return `${identity.brandName}#${identity.productName}`;
  }
  if (identity?.productName) return identity.productName;
  return `raw#${fallbackIndex}`;
}

// ---------- extraction: deep walk with contexts & dedupe ----------
function extractPageItems(response) {
  const items = [];
  const dedupe = new Set();
  const visited = new WeakSet();
  let rawCount = 0;

  const walk = (node, contexts) => {
    if (!node) return;

    if (Array.isArray(node)) {
      if (visited.has(node)) return;
      visited.add(node);
      rawCount += node.length;
      for (const entry of node) walk(entry, contexts);
      return;
    }

    if (typeof node !== "object") return;
    if (visited.has(node)) return;
    visited.add(node);

    // спробувати зібрати продукт з поточного вузла
    const record = buildProductRecord(node, contexts);
    if (record) {
      const key = createDedupeKey(record.identity, items.length);
      if (!dedupe.has(key)) {
        dedupe.add(key);
        items.push(record.item);
      }
    }

    // оновити контексти (беремо останні 3 рівні, + поточний)
    const nextContexts = Array.isArray(contexts) ? contexts.slice(-3) : [];
    nextContexts.push(node);

    // далі заглянути в усі вкладені обʼєкти
    for (const value of Object.values(node)) {
      if (value && typeof value === "object") {
        walk(value, nextContexts);
      }
    }
  };

  walk(response, []);
  return { items, rawCount };
}

// ---------- sumSavedItemsByKey (Mongoose-only) ----------
export async function sumSavedItemsByKey(key) {
  try {
    const r = await BambooPage.aggregate([
      { $match: { key } },
      { $project: { count: { $size: "$items" } } },
      { $group: { _id: null, total: { $sum: "$count" } } },
    ]);
    return r?.[0]?.total || 0;
  } catch {
    const pages = await BambooPage.find({ key }, { items: 1 }).lean();
    return pages.reduce((s, p) => s + (Array.isArray(p.items) ? p.items.length : 0), 0);
  }
}

// ---------- upsert helper (Mongoose only) ----------
async function upsertBambooPage(filter, pageDoc) {
  // 1) findOneAndUpdate → повернути документ «після»
  try {
    const q = BambooPage.findOneAndUpdate(
      filter,
      { $set: pageDoc },
      { upsert: true, setDefaultsOnInsert: true, new: true }
    );
    const doc = typeof q.lean === "function" ? await q.lean() : await q;
    if (doc) return doc?.toObject?.() || doc;
  } catch (e) {
    console.warn("[export] F1U failed:", e?.message || e);
  }

  // 2) updateOne + readback
  try {
    await BambooPage.updateOne(filter, { $set: pageDoc }, { upsert: true });
    const r = await BambooPage.findOne(filter, { _id: 1, pageIndex: 1, updatedAt: 1 }).lean();
    if (r) return r;
  } catch (e) {
    console.warn("[export] updateOne fallback failed:", e?.message || e);
  }

  // 3) FINAL — create, якщо досі порожньо
  try {
    const exists = await BambooPage.findOne(filter, { _id: 1 }).lean();
    if (!exists) {
      const created = await BambooPage.create({ ...filter, ...pageDoc });
      return created?.toObject?.() || created || null;
    }
  } catch (e) {
    console.warn("[export] create final fallback failed:", e?.message || e);
  }

  return null;
}

// ---------- main route ----------
bambooExportRouter.get("/bamboo/export.json", async (req, res) => {
  try {
    const rawQuery = { ...req.query };
    const {
      PageSize: PageSizeParam,
      PageIndex: _ignoredPageIndex,
      maxPages: maxPagesParam,
      resume: resumeParam,
      force: forceParam,
      ...restQuery
    } = rawQuery;

    const defaultPageSize = parseInt(process.env.CATALOG_PAGE_SIZE ?? "100", 10);
    const parsedPageSize = parseInt(PageSizeParam ?? "", 10);
    const PageSize = Number.isFinite(parsedPageSize)
      ? parsedPageSize
      : Number.isFinite(defaultPageSize)
        ? defaultPageSize
        : 100;

    const defaultMaxPages = parseInt(process.env.CATALOG_MAX_PAGES ?? "30", 10);
    const parsedMaxPages = parseInt(maxPagesParam ?? "", 10);
    const maxPages = Number.isFinite(parsedMaxPages)
      ? parsedMaxPages
      : Number.isFinite(defaultMaxPages)
        ? defaultMaxPages
        : 30;

    const resume = resumeParam == 1;
    const force = forceParam == 1;

    // стабільний ключ (не включає PageIndex)
    const passthrough = {};
    for (const k of Object.keys(restQuery || {}).sort()) {
      const value = restQuery[k];
      if (value !== undefined) passthrough[k] = value;
    }
    const keyBase = Object.keys(passthrough).length ? { PageSize, ...passthrough } : { PageSize };
    const key = JSON.stringify(keyBase);

    // rate limit guard
    const rl = await RateLimit.findOne({ key: RL_KEY }).lean();
    if (rl?.nextRetryAt && rl.nextRetryAt > new Date()) {
      return res.status(429).json({ ok: false, rateLimited: true, nextRetryAt: rl.nextRetryAt });
    }

    // resume / force
    let dump = await BambooDump.findOne({ key }).lean();
    let startPage = 0;
    let pagesFetched = 0;
    let totalItems = 0;

    if (force) {
      await Promise.all([
        BambooDump.deleteOne({ key }).catch(() => {}),
        BambooPage.deleteMany({ key }).catch(() => {}),
      ]);
      dump = null;
    } else if (resume && dump?.lastPage != null) {
      startPage = dump.lastPage + 1;
      try {
        totalItems = await sumSavedItemsByKey(key);
      } catch (e) {
        console.warn("[export] sumSavedItemsByKey failed during resume:", e?.message || e);
        totalItems = dump?.total || 0;
      }

      try {
        if (BambooPage && typeof BambooPage.countDocuments === "function") {
          pagesFetched = await BambooPage.countDocuments({ key });
        } else {
          const docs = await BambooPage.find({ key }, { _id: 1 }).lean();
          pagesFetched = Array.isArray(docs) ? docs.length : 0;
        }
      } catch (e) {
        console.warn("[export] countDocuments fallback for resume:", e?.message || e);
        try {
          const q = BambooPage.find({ key }, { _id: 1 });
          const docs = typeof q.lean === "function" ? await q.lean() : await q;
          pagesFetched = Array.isArray(docs) ? docs.length : 0;
        } catch (err) {
          console.warn("[export] resume fallback using dump stats:", err?.message || err);
          pagesFetched = dump?.pagesFetched || 0;
        }
      }
      if (!pagesFetched) pagesFetched = dump?.pagesFetched || 0;
      if (!totalItems) totalItems = dump?.total || 0;
    } else if (dump) {
      await BambooPage.deleteMany({ key }).catch(() => {});
    }

    // fetching loop
    for (let i = 0; i < maxPages; i++) {
      const pageIndex = startPage + i;
      const resp = await fetchCatalogPageWithRetry({ ...passthrough, PageSize, PageIndex: pageIndex });

      if (resp?.__rateLimited) {
        await RateLimit.findOneAndUpdate(
          { key: RL_KEY },
          { $set: { nextRetryAt: resp.nextRetryAt, updatedAt: new Date() } },
          { upsert: true }
        );
        break;
      }

      const { items: pageItems, rawCount } = extractPageItems(resp);

      if (!Array.isArray(pageItems) || pageItems.length === 0) {
        if (!rawCount) break;
        console.warn("[export] no catalog items extracted", {
          pageIndex,
          rawCount,
          keys: Object.keys(resp || {}),
        });
        continue;
      }

      const items = pageItems;
      const pageDoc = { key, pageIndex, items, updatedAt: new Date() };
      const saved = await upsertBambooPage({ key, pageIndex }, pageDoc);

      pagesFetched++;
      totalItems += items.length;

      const dumpUpdate = {
        $set: {
          query: { PageSize, maxPages, PageIndex: pageIndex, ...passthrough },
          pagesFetched,
          total: totalItems,
          lastPage: pageIndex,
          pageSize: PageSize,
          updatedAt: new Date(),
        },
      };

      let dumpDoc = null;
      try {
        const dumpQ = BambooDump.findOneAndUpdate(
          { key },
          dumpUpdate,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        dumpDoc = typeof dumpQ.lean === "function" ? await dumpQ.lean() : await dumpQ;
      } catch (e) {
        console.warn("[export] BambooDump upsert failed:", e?.message || e);
        // Фінальний фолбек — create, якщо немає
        try {
          const exists = await BambooDump.findOne({ key }, { _id: 1 }).lean();
          if (!exists) {
            dumpDoc = await BambooDump.create({
              key,
              query: { PageSize, maxPages, PageIndex: pageIndex, ...passthrough },
              pagesFetched,
              total: totalItems,
              lastPage: pageIndex,
              pageSize: PageSize,
              updatedAt: new Date(),
            });
            dumpDoc = dumpDoc?.toObject?.() || dumpDoc || null;
          }
        } catch (err) {
          console.warn("[export] BambooDump create fallback failed:", err?.message || err);
        }
      }

      console.log("[export] page persisted", {
        pageIndex,
        pagesFetched,
        pageItems: items.length,
        total: totalItems,
        key,
        docId: saved?._id ? String(saved._id) : null,
        dumpId: dumpDoc?._id ? String(dumpDoc._id) : null,
      });
    }

    // collect pages list (без items)
    let pagesDocs = [];
    try {
      const q = BambooPage.find({ key }, { items: 0 }).sort({ pageIndex: 1 });
      const docs = typeof q.lean === "function" ? await q.lean() : await q;
      if (Array.isArray(docs)) pagesDocs = docs;
    } catch (err) {
      console.warn("[export] page list via model failed:", err?.message || err);
    }

    // savedItems total
    let savedItems = 0;
    try {
      savedItems = await sumSavedItemsByKey(key);
    } catch (err) {
      console.warn("[export] sumSavedItemsByKey failed:", err?.message || err);
      for (const p of pagesDocs) {
        const full = await BambooPage.findOne({ key, pageIndex: p.pageIndex }, { items: 1 }).lean();
        savedItems += Array.isArray(full?.items) ? full.items.length : 0;
      }
    }

    return res.json({
      ok: true,
      pagesFetched,
      totalItems,
      lastPage: pagesDocs?.length ? pagesDocs.at(-1).pageIndex : null,
      rateLimit: null,
      pages: pagesDocs.map((p) => ({ pageIndex: p.pageIndex, updatedAt: p.updatedAt })),
      savedItems,
    });
  } catch (error) {
    console.error("[export] handler failed", error);
    if (res.headersSent) return req.socket?.destroy?.();
    const status = typeof error?.status === "number" ? error.status : 500;
    const payload = { ok: false, error: error?.message || "Export failed" };
    if (error?.nextRetryAt) payload.nextRetryAt = error.nextRetryAt;
    return res.status(status).json(payload);
  }
});
