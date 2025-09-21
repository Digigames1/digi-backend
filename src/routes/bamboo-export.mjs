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

    const passthrough = { ...restQuery };
    const keyPayload = { PageSize };
    for (const k of Object.keys(passthrough).sort()) {
      const value = passthrough[k];
      if (value !== undefined) {
        keyPayload[k] = value;
      }
    }
    const key = JSON.stringify(keyPayload);

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

      if (!resp || !Array.isArray(resp.items) || resp.items.length === 0) break;

      const pageItems = [];
      for (const brand of resp.items || []) {
        for (const p of brand.products || []) {
          pageItems.push({
            brand: brand.name,
            id: p.id,
            name: p.name,
            countryCode: p.countryCode,
            currencyCode: p.currencyCode || p?.price?.currencyCode,
            priceMin: p.price?.min,
            priceMax: p.price?.max,
            modifiedDate: p.modifiedDate ? new Date(p.modifiedDate) : null,
            raw: p,
          });
        }
      }

      const pageDoc = {
        key,
        pageIndex,
        items: Array.isArray(pageItems) ? pageItems : [],
        updatedAt: new Date(),
      };

      const saved = await BambooPage.findOneAndUpdate(
        { key, pageIndex },
        { $set: pageDoc },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      pagesFetched++;
      totalItems += Array.isArray(saved?.items) ? saved.items.length : pageItems.length;

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
        pageItems: pageItems.length,
        total: totalItems,
        key,
        docId: saved?._id?.toString?.() ?? saved?._id ?? null,
        savedItems: Array.isArray(saved?.items) ? saved.items.length : null,
      });
    }

    const pagesDocs = await BambooPage.find({ key }, { items: 0 }).sort({ pageIndex: 1 }).lean();

    let savedItems = 0;
    for (const p of pagesDocs) {
      const full = await BambooPage.findOne({ key, pageIndex: p.pageIndex }, { items: 1 }).lean();
      savedItems += Array.isArray(full?.items) ? full.items.length : 0;
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
