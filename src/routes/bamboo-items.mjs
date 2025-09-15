// src/routes/bamboo-items.mjs
import { Router } from "express";
import { BambooDump } from "../models/BambooDump.mjs";

export const bambooItemsRouter = Router();

/** Швидкий перегляд останнього дампа */
bambooItemsRouter.get("/bamboo/items", async (req, res) => {
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || "20", 10)));
  const dump = await BambooDump.findOne({}, {}, { sort: { updatedAt: -1 } }).lean();
  const count = dump?.items?.length || 0;
  const sample = dump?.items?.slice(0, limit) || [];
  res.json({
    ok: true,
    count,
    sampleMeta: sample.map(x => ({
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
