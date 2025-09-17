import { Router } from "express";
import { BambooDump } from "../models/BambooDump.mjs";
import { BambooPage } from "../models/BambooPage.mjs";

export const bambooPagesRouter = Router();

bambooPagesRouter.get("/bamboo/pages", async (_req, res) => {
  const dump = await BambooDump.findOne({}, {}, { sort: { updatedAt: -1 } }).lean();
  if (!dump) return res.json({ ok: true, key: null, pages: [], savedItems: 0 });

  const key = dump.key;
  const pages = await BambooPage.find({ key }, { items: 0 }).sort({ pageIndex: 1 }).lean();
  let savedItems = 0;
  const withCounts = [];
  for (const p of pages) {
    const page = await BambooPage.findOne({ key, pageIndex: p.pageIndex }, { items: 1 }).lean();
    const cnt = Array.isArray(page?.items) ? page.items.length : 0;
    savedItems += cnt;
    withCounts.push({ pageIndex: p.pageIndex, count: cnt, updatedAt: p.updatedAt });
  }
  res.json({ ok: true, key, pages: withCounts, savedItems });
});
