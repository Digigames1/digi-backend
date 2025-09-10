// src/routes/bamboo-export.mjs
import { Router } from "express";
import { mongoose } from "../db/mongoose.mjs";
import { BambooDump } from "../models/BambooDump.mjs";
import { fetchCatalogPaged } from "../services/bambooClient.mjs";

export const bambooExportRouter = Router();

function assertModelHas(model, methods = []) {
  for (const m of methods) {
    if (typeof model?.[m] !== "function") {
      throw new Error(`BambooDump model missing method: ${m}`);
    }
  }
}

let running = false;

bambooExportRouter.get("/bamboo/export.json", async (req, res) => {
  try {
    // sanity check: we really have a Mongoose Model
    assertModelHas(BambooDump, ["findOneAndUpdate", "deleteOne", "findOne"]);

    if (running) return res.status(429).json({ ok: false, error: "Export already running" });

    const PageSize = parseInt(req.query.PageSize ?? process.env.CATALOG_PAGE_SIZE ?? "100", 10);
    const maxPages = parseInt(req.query.maxPages ?? process.env.CATALOG_MAX_PAGES ?? "30", 10);
    const PageIndex = parseInt(req.query.PageIndex ?? "0", 10);
    const force = req.query.force == 1 || req.query.force === "1";

    const passthrough = {};
    ["CurrencyCode", "CountryCode", "Name", "ModifiedDate", "ProductId", "BrandId", "TargetCurrency"].forEach(k => {
      if (req.query[k] != null) passthrough[k] = req.query[k];
    });

    const key = JSON.stringify({ PageSize, maxPages, PageIndex, ...passthrough });

    running = true;

    if (force) {
      await BambooDump.deleteOne({ key }).catch(() => {});
    }

    let totalItems = 0;
    let pagesFetched = 0;
    const itemsAcc = [];

    await fetchCatalogPaged({ PageSize, maxPages, PageIndex, ...passthrough }, async (data) => {
      pagesFetched++;
      for (const brand of data.items || []) {
        const brandName = brand.name;
        for (const p of brand.products || []) {
          itemsAcc.push({
            brand: brandName,
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
      totalItems = itemsAcc.length;
      await BambooDump.findOneAndUpdate(
        { key },
        {
          $set: {
            query: { PageSize, maxPages, PageIndex, ...passthrough },
            items: itemsAcc,
            pagesFetched,
            total: totalItems,
            updatedAt: new Date(),
          },
        },
        { upsert: true, new: true }
      );
    });

    const doc = await BambooDump.findOne({ key }).lean();
    return res.json({
      ok: true,
      pagesFetched,
      totalItems,
      key,
      sample: doc?.items?.slice(0, 3) || [],
    });
  } catch (e) {
    const status = e?.status || 500;
    return res.status(status).json({ ok: false, error: e?.message || String(e) });
  } finally {
    running = false;
  }
});
