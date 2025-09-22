// src/routes/bamboo-export.mjs
import { Router } from "express";
import { getNativeCollection } from "../db/mongoose.mjs";
import { RateLimit } from "../models/RateLimit.mjs";
import { BambooDump } from "../models/BambooDump.mjs";
import { BambooPage } from "../models/BambooPage.mjs";
import { fetchCatalogPageWithRetry } from "../services/bambooClient.mjs";

export const bambooExportRouter = Router();

const RL_KEY = "bamboo:catalog";

// Повертає загальну кількість айтемів у всіх сторінках для key
export async function sumSavedItemsByKey(key) {
  // A) Mongoose aggregate — якщо це справжня модель
  if (BambooPage && typeof BambooPage.aggregate === "function") {
    try {
      const r = await BambooPage.aggregate([
        { $match: { key } },
        { $project: { count: { $size: "$items" } } },
        { $group: { _id: null, total: { $sum: "$count" } } },
      ]);
      return r?.[0]?.total || 0;
    } catch (e) {
      console.warn("[export] aggregate(model) failed:", e?.message || e);
    }
  }

  // B) Native aggregate через connection.db.collection(...)
  try {
    const coll = getNativeCollection("bamboo_pages");
    const r = await coll
      .aggregate([
        { $match: { key } },
        { $project: { count: { $size: "$items" } } },
        { $group: { _id: null, total: { $sum: "$count" } } },
      ])
      .toArray();
    return r?.[0]?.total || 0;
  } catch (e) {
    console.warn("[export] aggregate(native) failed:", e?.message || e);
  }

  // C) Клієнтське сумування як останній фолбек
  try {
    const pages = await BambooPage.find({ key }, { items: 1 }).lean();
    let total = 0;
    for (const p of pages) total += Array.isArray(p.items) ? p.items.length : 0;
    return total;
  } catch (e) {
    console.warn("[export] client-sum failed:", e?.message || e);
    return 0;
  }
}

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

function extractPageItems(response) {
  const items = [];
  const dedupe = new Set();
  const visited = new WeakSet();
  let rawCount = 0;

  const isObjectArray = (value) =>
    Array.isArray(value) && value.some((entry) => entry && typeof entry === "object");

  const walk = (node, ctx) => {
    if (!node) return;

    if (Array.isArray(node)) {
      if (visited.has(node)) return;
      visited.add(node);
      rawCount += node.length;
      for (const entry of node) {
        walk(entry, ctx);
      }
      return;
    }

    if (typeof node !== "object") return;
    if (visited.has(node)) return;
    visited.add(node);

    let forwarded = false;
    for (const value of Object.values(node)) {
      if (isObjectArray(value)) {
        forwarded = true;
        walk(value, node);
      }
    }

    if (forwarded) return;

    const product = node;

    const idKey = pickString(
      product.id,
      product.productId,
      product.productID,
      product.ProductId,
      product.sku,
      product.code,
      product.itemId,
      product.itemID,
      product.programProductId
    );
    const nameKey = pickString(product.name, product.productName, product.title, product.displayName, product.itemName);
    const brandName =
      pickString(
        product.brand,
        product.brandName,
        product.brand_title,
        product.programBrand,
        product.program,
        product.vendor,
        product.vendorName,
        ctx?.name,
        ctx?.brand,
        ctx?.brandName,
        ctx?.brand_title,
        ctx?.programBrand,
        ctx?.program
      ) || null;

    let dedupeKey;
    if (idKey) {
      dedupeKey = `${idKey}#${brandName || ""}`;
    } else if (brandName && nameKey) {
      dedupeKey = `${brandName}#${nameKey}`;
    } else if (nameKey) {
      dedupeKey = nameKey;
    } else {
      dedupeKey = `raw#${items.length}`;
    }
    if (dedupe.has(dedupeKey)) return;
    dedupe.add(dedupeKey);

    const productId = pickNumber(
      product.id,
      product.productId,
      product.productID,
      product.ProductId,
      product.sku,
      product.code,
      product.itemId,
      product.itemID,
      product.programProductId
    );

    const productName =
      nameKey ||
      pickString(product.description, product.shortDescription) ||
      brandName ||
      idKey ||
      null;

    const countryCode =
      pickString(
        product.countryCode,
        product.country,
        product.countryIso,
        product.countryIsoCode,
        product.countryISO,
        product.region,
        ctx?.countryCode,
        ctx?.country,
        ctx?.countryIso,
        ctx?.countryIsoCode,
        ctx?.region
      ) || null;

    const currencyCode =
      pickString(
        product.currencyCode,
        product.currency,
        product.currencyIso,
        product.currencyISO,
        product.priceCurrency,
        product.price?.currencyCode,
        product.price?.currency,
        ctx?.currencyCode,
        ctx?.currency,
        ctx?.currencyIso,
        ctx?.currencyISO
      ) || null;

    const priceMin =
      pickNumber(
        product.price?.min,
        product.priceMin,
        product.minPrice,
        product.lowestDenomination,
        product.minDenomination,
        product.minDenominationValue,
        product.denominationMin,
        product.denominationLow,
        product.minimumAmount,
        product.min
      ) ?? null;

    const priceMax =
      pickNumber(
        product.price?.max,
        product.priceMax,
        product.maxPrice,
        product.highestDenomination,
        product.maxDenomination,
        product.maxDenominationValue,
        product.denominationMax,
        product.denominationHigh,
        product.maximumAmount,
        product.max
      ) ?? null;

    const modifiedDate =
      pickDate(
        product.modifiedDate,
        product.lastModified,
        product.updatedAt,
        product.lastUpdate,
        product.lastUpdateDate,
        product.modifiedAt,
        product.updatedOn,
        product.lastModifiedDate
      ) || null;

    items.push({
      brand: brandName,
      id: productId ?? null,
      name: productName || "Unnamed product",
      countryCode,
      currencyCode,
      priceMin,
      priceMax,
      modifiedDate,
      raw: product,
    });
  };

  walk(response, null);

  return { items, rawCount };
}

async function upsertBambooPage(filter, pageDoc) {
  const update = { $set: pageDoc };
  const baseOptions = { upsert: true, writeConcern: { w: 1 } };
  const projection = { _id: 1, pageIndex: 1, updatedAt: 1 };

  if (BambooPage && typeof BambooPage.findOneAndUpdate === "function") {
    const query = BambooPage.findOneAndUpdate(filter, update, {
      ...baseOptions,
      setDefaultsOnInsert: true,
      returnDocument: "after",
      new: true,
      projection,
    });
    if (typeof query.lean === "function") {
      return await query.lean();
    }
    const doc = await query;
    return doc?.toObject?.() || doc;
  }

  if (BambooPage && typeof BambooPage.updateOne === "function") {
    await BambooPage.updateOne(filter, update, baseOptions);
    if (typeof BambooPage.findOne === "function") {
      return BambooPage.findOne(filter, projection).lean();
    }
  }

  const coll = getNativeCollection("bamboo_pages");
  const native = await coll.findOneAndUpdate(filter, update, {
    ...baseOptions,
    returnDocument: "after",
    projection,
  });
  if (native?.value) return native.value;
  return coll.findOne(filter, { projection });
}

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

    const passthrough = {};
    for (const k of Object.keys(restQuery || {}).sort()) {
      const value = restQuery[k];
      if (value !== undefined) {
        passthrough[k] = value;
      }
    }
    // сформуй стабільний ключ (мінімум PageSize; НЕ включай pageIndex у key)
    const keyBase = Object.keys(passthrough).length ? { PageSize, ...passthrough } : { PageSize };
    const key = JSON.stringify(keyBase);

    const rl = await RateLimit.findOne({ key: RL_KEY }).lean();
    if (rl?.nextRetryAt && rl.nextRetryAt > new Date()) {
      return res.status(429).json({ ok:false, rateLimited:true, nextRetryAt: rl.nextRetryAt });
    }

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
          const coll = getNativeCollection("bamboo_pages");
          pagesFetched = await coll.countDocuments({ key });
        }
      } catch (e) {
        console.warn("[export] countDocuments fallback for resume:", e?.message || e);
        try {
          const coll = getNativeCollection("bamboo_pages");
          const docs = await coll.find({ key }, { projection: { _id: 1 } }).toArray();
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

      const pageDoc = {
        key,
        pageIndex,
        items,
        updatedAt: new Date(),
      };

      const saved = await upsertBambooPage({ key, pageIndex }, pageDoc);

      pagesFetched++;
      totalItems += items.length;

      const update = {
        $set: {
          query: { PageSize, maxPages, PageIndex: pageIndex, ...passthrough },
          pagesFetched,
          total: totalItems,
          lastPage: pageIndex,
          pageSize: PageSize,
          updatedAt: new Date(),
        },
      };
      await BambooDump.findOneAndUpdate({ key }, update, { upsert: true, new: true });
      console.log("[export] page persisted", {
        pageIndex,
        pagesFetched,
        pageItems: items.length,
        total: totalItems,
        key,
        docId: saved?._id ? String(saved._id) : null,
      });
    }

    const pagesDocs = await BambooPage.find({ key }, { items: 0 }).sort({ pageIndex: 1 }).lean();

    let savedItems = 0;
    try {
      savedItems = await sumSavedItemsByKey(key);
    } catch (err) {
      console.warn("[export] sumSavedItemsByKey failed at finalize:", err?.message || err);
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
      pages: pagesDocs.map(p => ({ pageIndex: p.pageIndex, updatedAt: p.updatedAt })),
      savedItems,
    });
  } catch (error) {
    console.error("[export] handler failed", error);
    if (res.headersSent) {
      return req.socket?.destroy?.();
    }
    const status = typeof error?.status === "number" ? error.status : 500;
    const payload = {
      ok: false,
      error: error?.message || "Export failed",
    };
    if (error?.nextRetryAt) {
      payload.nextRetryAt = error.nextRetryAt;
    }
    return res.status(status).json(payload);
  }
});
