// src/routes/bamboo-status.mjs
import { Router } from "express";
import { RateLimit } from "../models/RateLimit.mjs";
import { BambooDump } from "../models/BambooDump.mjs";
import { sumSavedItemsByKey } from "./bamboo-export.mjs";

export const bambooStatusRouter = Router();

bambooStatusRouter.get("/bamboo/status", async (req, res) => {
  let dumps = await BambooDump.find({}, { key:1, pagesFetched:1, total:1, lastPage:1, pageSize:1, updatedAt:1 })
    .sort({ updatedAt:-1 })
    .lean();
  const keys = dumps.map(d => d.key).filter(Boolean);
  let countsByKey = new Map();
  if (keys.length) {
    const uniqueKeys = [...new Set(keys)];
    const entries = await Promise.all(
      uniqueKeys.map(async (key) => {
        try {
          const total = await sumSavedItemsByKey(key);
          return [key, total || 0];
        } catch (error) {
          console.warn("[status] sumSavedItemsByKey failed:", error?.message || error);
          return [key, 0];
        }
      })
    );
    countsByKey = new Map(entries);
  }
  dumps = dumps.map(d => ({
    key: d.key,
    pagesFetched: d.pagesFetched,
    total: d.total,
    lastPage: d.lastPage,
    pageSize: d.pageSize,
    updatedAt: d.updatedAt,
    count: countsByKey.get(d.key) || 0,
  }));
  const rl = await RateLimit.findOne({ key: "bamboo:catalog" }).lean();
  res.json({ ok:true, rateLimit: rl?.nextRetryAt || null, dumps });
});
