// src/routes/bamboo-export.mjs
import { Router } from "express";
import { RateLimit } from "../models/RateLimit.mjs";
import { BambooDump } from "../models/BambooDump.mjs";
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
  const itemsAcc = dump?.items ? [...dump.items] : [];

  if (force) {
    await BambooDump.deleteOne({ key }).catch(()=>{});
    dump = null;
  } else if (resume && dump?.lastPage != null) {
    startPage = dump.lastPage + 1;
  }

  let pagesFetched = dump?.pagesFetched || 0;
  let totalItems = itemsAcc.length;

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

    for (const brand of resp.items) {
      for (const p of brand.products || []) {
        itemsAcc.push({
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

    pagesFetched++;
    totalItems = itemsAcc.length;

    const update = {
      $set: {
        query: { PageSize, maxPages, PageIndex: pageIndex, ...passthrough },
        items: itemsAcc,
        pagesFetched,
        total: totalItems,
        lastPage: pageIndex,
        pageSize: PageSize,
        updatedAt: new Date(),
      },
    };
    const doc = await BambooDump.findOneAndUpdate({ key }, update, { upsert: true, new: true });
    console.log("[export] page persisted", {
      pageIndex,
      pagesFetched,
      total: totalItems,
      savedItems: doc?.items?.length ?? null,
      key,
    });
  }

  const nextRl = await RateLimit.findOne({ key: RL_KEY }).lean();
  const doc = await BambooDump.findOne({ key }).lean();
  const saved = Array.isArray(doc?.items) ? doc.items.length : 0;
  res.json({
    ok: true,
    pagesFetched,
    totalItems,
    lastPage: doc?.lastPage ?? null,
    rateLimit: nextRl?.nextRetryAt ? { nextRetryAt: nextRl.nextRetryAt } : null,
    sample: (doc?.items && doc.items.slice(0, 3)) || [],
    savedItems: saved,
  });
});
