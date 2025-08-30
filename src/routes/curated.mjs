import express from "express";
import CuratedCatalog from "../models/CuratedCatalog.mjs";
import { fetchMatrix } from "../catalog/bambooMatrix.mjs";

export const curatedRouter = express.Router();

const TTL_MIN = Math.max(5, Number(process.env.CATALOG_TTL_MIN || 60));
const KEY = "curated:v1";

async function ensureFresh({ countries, currencies }) {
  const doc = await CuratedCatalog.findOne({ key: KEY }).lean();
  const fresh =
    doc && Date.now() - new Date(doc.updatedAt).getTime() < TTL_MIN * 60 * 1000;
  if (fresh) return doc.data;

  const { categories, meta } = await fetchMatrix({ countries, currencies });
  const data = { categories, meta, updatedAt: new Date().toISOString() };
  await CuratedCatalog.updateOne(
    { key: KEY },
    { $set: { data, updatedAt: new Date() } },
    { upsert: true }
  );
  return data;
}

curatedRouter.get("/curated", async (req, res) => {
  try {
    const split = (s) =>
      String(s || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
    const countries = req.query.countries ? split(req.query.countries) : undefined;
    const currencies = req.query.currencies ? split(req.query.currencies) : undefined;
    const data = await ensureFresh({ countries, currencies });
    res.json({ ok: true, ...data });
  } catch (e) {
    res
      .status(200)
      .json({ ok: false, error: e?.response?.data || e?.message || "failed" });
  }
});
