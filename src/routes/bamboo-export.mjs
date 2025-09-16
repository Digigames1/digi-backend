// src/routes/bamboo-export.mjs
import { Router } from "express";
import { RateLimit } from "../models/RateLimit.mjs";
import { BambooDump } from "../models/BambooDump.mjs";
import { BambooPage } from "../models/BambooPage.mjs";
import { fetchCatalogPageWithRetry } from "../services/bambooClient.mjs";

export const bambooExportRouter = Router();

const RL_KEY = "bamboo:catalog";

bambooExportRouter.get("/bamboo/export.json", async (req, res) => {
  const PageSize = parseInt(req.query.PageSize ?? process.env.CATALOG_PAGE_SIZE ?? "100", 10);
  const maxPages = parseInt(req.query.maxPages ?? process.env.CATALOG_MAX_PAGES ?? "30", 10);
  const resume = req.query.resume == 1;
  const force = req.query.force == 1;

  const passthrough = {};
  ["CurrencyCode","CountryCode","Name","ModifiedDate","ProductId","BrandId","TargetCurrency"].forEach(k=>{
    if (req.query[k] != null) passthrough[k] = req.query[k];
  });

  const key = JSON.stringify({ PageSize, ...passthrough });

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
    const stats = await BambooPage.aggregate([
      { $match: { key } },
      { $project: { count: { $size: "$items" } } },
      { $group: { _id: null, total: { $sum: "$count" }, pages: { $sum: 1 } } },
    ]);
    if (stats?.[0]) {
      pagesFetched = stats[0].pages || 0;
      totalItems = stats[0].total || 0;
    } else {
      pagesFetched = dump?.pagesFetched || 0;
      totalItems = dump?.total || 0;
    }
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

    await BambooPage.findOneAndUpdate(
      { key, pageIndex },
      { $set: { items: pageItems, updatedAt: new Date() } },
      { upsert: true, new: true }
    );

    pagesFetched++;
    totalItems += pageItems.length;

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
    });
  }

  const nextRl = await RateLimit.findOne({ key: RL_KEY }).lean();
  const doc = await BambooDump.findOne({ key }).lean();
  const pages = await BambooPage.find({ key }, { items: 0 }).sort({ pageIndex: 1 }).lean();
  const saved = await BambooPage.aggregate([
    { $match: { key } },
    { $project: { count: { $size: "$items" } } },
    { $group: { _id: null, total: { $sum: "$count" } } },
  ]).then((r) => r?.[0]?.total || 0);
  res.json({
    ok: true,
    pagesFetched,
    totalItems,
    lastPage: doc?.lastPage ?? null,
    rateLimit: nextRl?.nextRetryAt ? { nextRetryAt: nextRl.nextRetryAt } : null,
    pages,
    savedItems: saved,
  });
});
