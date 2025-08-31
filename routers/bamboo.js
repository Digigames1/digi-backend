import { Router } from "express";
import { getCuratedFromCache } from "../src/catalog/cache.mjs";
export const bambooRouter = Router();

// приклад: віддати "картки" геймінгу з кешу
bambooRouter.get("/cards/gaming", async (_req, res) => {
  try {
    const out = await getCuratedFromCache({});
    const items = out.data?.categories?.gaming || [];
    res.json({ ok: true, source: out.source, count: items.length, items });
  } catch (e) {
    res.status(200).json({ ok: false, error: e?.message || "failed" });
  }
});

// приклад: загальний каталог (усі категорії з кешу)
bambooRouter.get("/cards/all", async (_req, res) => {
  try {
    const out = await getCuratedFromCache({});
    res.json({ ok: true, source: out.source, data: out.data });
  } catch (e) {
    res.status(200).json({ ok: false, error: e?.message || "failed" });
  }
});

export default bambooRouter;
