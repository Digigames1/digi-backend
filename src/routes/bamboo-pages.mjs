import { Router } from "express";
import { BambooDump } from "../models/BambooDump.mjs";
import { BambooPage } from "../models/BambooPage.mjs";

export const bambooPagesRouter = Router();

bambooPagesRouter.get("/bamboo/pages", async (_req, res) => {
  // беремо останній ключ, якщо є BambooDump; якщо ні — беремо будь-який наявний у BambooPage
  let key = null;
  const dump = await BambooDump.findOne({}, {}, { sort: { updatedAt: -1 } }).lean().catch(() => null);
  if (dump?.key) key = dump.key;
  if (!key) {
    const any = await BambooPage.findOne({}, { key: 1 }, { sort: { updatedAt: -1 } }).lean().catch(() => null);
    if (any?.key) key = any.key;
  }

  if (!key) return res.json({ ok: true, key: null, pages: [], savedItems: 0 });

  const pages = await BambooPage.find({ key }, { items: 0 }).sort({ pageIndex: 1 }).lean();
  let savedItems = 0;
  const withCounts = [];
  for (const p of pages) {
    const doc = await BambooPage.findOne({ key, pageIndex: p.pageIndex }, { items: 1 }).lean();
    const cnt = Array.isArray(doc?.items) ? doc.items.length : 0;
    savedItems += cnt;
    withCounts.push({ pageIndex: p.pageIndex, count: cnt, updatedAt: p.updatedAt });
  }
  res.json({ ok: true, key, pages: withCounts, savedItems });
});
