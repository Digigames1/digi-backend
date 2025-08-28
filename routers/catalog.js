import express from "express";
import { fetchAllBambooProducts, mapProduct } from "../utils/bamboo.js";
import { applyMarkup } from "../utils/markup.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { currency, lang } = req.query;
    const raw = await fetchAllBambooProducts({ currency, lang });
    const mapped = raw.map(mapProduct).map(p => {
      const price = applyMarkup(p.price, p);
      return {
        ...p,
        price,
        oldPrice: p.price && price < p.price ? p.price : undefined,
      };
    });

    const grouped = {};
    for (const p of mapped) {
      const cat = p.category || "other";
      if (!grouped[cat]) {
        grouped[cat] = {
          products: [],
          regions: new Set(),
          denominations: new Set(),
        };
      }
      grouped[cat].products.push(p);
      if (p.region) grouped[cat].regions.add(p.region);
      if (p.denomination) grouped[cat].denominations.add(p.denomination);
    }

    const result = {};
    for (const [cat, g] of Object.entries(grouped)) {
      result[cat] = {
        products: g.products,
        regions: Array.from(g.regions),
        denominations: Array.from(g.denominations).sort((a, b) => a - b),
      };
    }

    res.json(result);
  } catch (e) {
    console.error("[/api/catalog]", e?.message || e);
    res.status(500).json({ error: true });
  }
});

export default router;
