// src/routes/bamboo-status.mjs
import { Router } from "express";
import { RateLimit } from "../models/RateLimit.mjs";
import { BambooDump } from "../models/BambooDump.mjs";

export const bambooStatusRouter = Router();

bambooStatusRouter.get("/bamboo/status", async (req, res) => {
  const dumps = await BambooDump.find({}, { key:1, pagesFetched:1, total:1, lastPage:1, pageSize:1, updatedAt:1 }).sort({ updatedAt:-1 }).lean();
  const rl = await RateLimit.findOne({ key: "bamboo:catalog" }).lean();
  res.json({ ok:true, rateLimit: rl?.nextRetryAt || null, dumps });
});
