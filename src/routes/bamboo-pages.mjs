import { Router } from "express";
import { BambooPage } from "../models/BambooPage.mjs";

export const bambooPagesRouter = Router();

// GET /api/bamboo/pages?key=<json-string>
bambooPagesRouter.get("/bamboo/pages", async (req, res) => {
  try {
    const key = req.query.key
      ? String(req.query.key)
      : JSON.stringify({ PageSize: 50 });

    const pages = await BambooPage.find({ key })
      .sort({ pageIndex: 1 })
      .lean();

    const summary = pages.map(p => ({
      pageIndex: p.pageIndex,
      count: Array.isArray(p.items) ? p.items.length : 0,
      updatedAt: p.updatedAt,
      _id: String(p._id),
    }));

    const savedItems = summary.reduce((s, p) => s + p.count, 0);

    res.json({ ok: true, key, pages: summary, savedItems });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || "pages failed" });
  }
});
