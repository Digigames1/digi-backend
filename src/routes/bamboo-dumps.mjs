import { Router } from "express";
import { BambooDump } from "../models/BambooDump.mjs";

export const bambooDumpsRouter = Router();

// GET /api/bamboo/dumps — останні 20 дампів
bambooDumpsRouter.get("/bamboo/dumps", async (req, res) => {
  try {
    const dumps = await BambooDump.find({}, { key: 1, pagesFetched: 1, total: 1, lastPage: 1, pageSize: 1, updatedAt: 1 })
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();

    res.json({ ok: true, count: dumps.length, dumps });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || "dumps failed" });
  }
});
