// src/routes/bamboo-items.mjs
import { Router } from "express";
import { BambooDump } from "../models/BambooDump.mjs";
import { BambooPage } from "../models/BambooPage.mjs";

export const bambooItemsRouter = Router();

/** Швидкий перегляд останнього дампа */
bambooItemsRouter.get("/bamboo/items", async (req, res) => {
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || "20", 10)));
  const dump = await BambooDump.findOne({}, {}, { sort: { updatedAt: -1 } }).lean();
  if (!dump) {
    return res.json({ ok: true, count: 0, sampleMeta: [] });
  }

  const key = dump.key;
  const page =
    (dump.lastPage != null
      ? await BambooPage.findOne({ key, pageIndex: dump.lastPage }, {}).lean()
      : null) || (await BambooPage.findOne({ key }, {}).sort({ pageIndex: 1 }).lean());

  const allCount = await BambooPage.aggregate([
    { $match: { key } },
    { $project: { count: { $size: "$items" } } },
    { $group: { _id: null, total: { $sum: "$count" } } },
  ]).then((r) => r?.[0]?.total || 0);

  const sample = page?.items?.slice(0, limit) || [];
  res.json({
    ok: true,
    key,
    pagesFetched: dump.pagesFetched || 0,
    lastPage: dump.lastPage ?? null,
    pageSize: dump.pageSize ?? null,
    count: allCount,
    sampleMeta: sample.map((x) => ({
      id: x.id,
      brand: x.brand,
      name: x.name,
      countryCode: x.countryCode,
      currencyCode: x.currencyCode,
      priceMin: x.priceMin,
      priceMax: x.priceMax,
    })),
  });
});
