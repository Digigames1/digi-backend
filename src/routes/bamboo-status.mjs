// src/routes/bamboo-status.mjs
import { Router } from "express";
import { RateLimit } from "../models/RateLimit.mjs";
import { BambooDump } from "../models/BambooDump.mjs";

export const bambooStatusRouter = Router();

bambooStatusRouter.get("/bamboo/status", async (req, res) => {
  let dumps = await BambooDump.find({}, { key:1, pagesFetched:1, total:1, lastPage:1, pageSize:1, updatedAt:1, items:1 })
    .sort({ updatedAt:-1 })
    .lean();
  dumps = dumps.map(d => ({
    key: d.key,
    pagesFetched: d.pagesFetched,
    total: d.total,
    lastPage: d.lastPage,
    pageSize: d.pageSize,
    updatedAt: d.updatedAt,
    count: Array.isArray(d.items) ? d.items.length : 0,
  }));
  const rl = await RateLimit.findOne({ key: "bamboo:catalog" }).lean();
  res.json({ ok:true, rateLimit: rl?.nextRetryAt || null, dumps });
});
