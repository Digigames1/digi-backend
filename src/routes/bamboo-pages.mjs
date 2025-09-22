import { Router } from "express";
import { BambooPage } from "../models/BambooPage.mjs";

export const bambooPagesRouter = Router();

bambooPagesRouter.get("/bamboo/pages", async (_req, res) => {
  // знайдемо будь-який останній key, що є у колекції
  const keys = await BambooPage.distinct("key").catch(() => []);
  const key = keys?.[0] || null;

  if (!key) return res.json({ ok: true, key: null, pages: [], savedItems: 0 });

  const pages = await BambooPage.find({ key }, { items: 0 })
    .sort({ pageIndex: 1 })
    .lean();

  let savedItems = 0;
  const withCounts = [];
  for (const p of pages) {
    const doc = await BambooPage.findOne(
      { key, pageIndex: p.pageIndex },
      { items: 1 }
    ).lean();
    const cnt = Array.isArray(doc?.items) ? doc.items.length : 0;
    savedItems += cnt;
    withCounts.push({ pageIndex: p.pageIndex, count: cnt, updatedAt: p.updatedAt });
  }

  return res.json({ ok: true, key, pages: withCounts, savedItems });
});
