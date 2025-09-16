import { Router } from "express";
import { BambooDump } from "../models/BambooDump.mjs";
import { BambooPage } from "../models/BambooPage.mjs";

export const bambooPagesRouter = Router();

/** GET /api/bamboo/pages */
bambooPagesRouter.get("/bamboo/pages", async (_req, res) => {
  const dump = await BambooDump.findOne({}, {}, { sort: { updatedAt: -1 } }).lean();
  if (!dump) return res.json({ ok: true, pages: [] });
  const pages = await BambooPage.find({ key: dump.key }, { items: 0 }).sort({ pageIndex: 1 }).lean();
  res.json({ ok: true, key: dump.key, pages });
});
