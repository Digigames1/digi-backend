// src/routes/curated.mjs
import { Router } from "express";
import { buildCurated, getCuratedSection } from "../services/curate.mjs";
import { CuratedCatalog } from "../models/CuratedCatalog.mjs";

export const curatedRouter = Router();

/** GET /api/curated/refresh?currencies=USD,EUR,CAD,AUD */
curatedRouter.get("/curated/refresh", async (req, res) => {
  const currencies = (req.query.currencies || "USD,EUR,CAD,AUD").split(",").map(s => s.trim()).filter(Boolean);
  const out = await buildCurated({ currencies });
  if (!out.ok) return res.status(400).json(out);
  return res.json(out);
});

/** GET /api/curated/status */
curatedRouter.get("/curated/status", async (_req, res) => {
  const doc = await CuratedCatalog.findOne({ key: "default" }).lean();
  res.json({
    ok: true,
    updatedAt: doc?.updatedAt || null,
    currencies: doc?.currencies || [],
    source: doc?.source || {},
  });
});

/** GET /api/curated/gaming */
curatedRouter.get("/curated/gaming", async (_req, res) => {
  const out = await getCuratedSection("gaming");
  res.json(out);
});

export default curatedRouter;

