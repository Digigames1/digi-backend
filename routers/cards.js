import express from "express";
import { bambooFetch, mapProduct } from "../utils/bamboo.js";

const router = express.Router();

/**
 * GET /api/cards
 * query: category, q, sort (popular|priceAsc|priceDesc|ratingDesc),
 *        regions (comma), inStock (1|0), page, limit
 */
router.get("/", async (req, res) => {
  try {
    const {
      category,
      q,
      sort,
      regions,
      inStock,
      page = "1",
      limit = "24",
    } = req.query;

    // Параметри для Bamboo (підлаштуй під реальне API Bamboo)
    const params = {
      category,
      search: q,
      inStock: inStock ? "true" : undefined,
      regions,          // якщо Bamboo приймає CSV
      page,
      limit,
    };

    // 1) Тягнемо з Bamboo
    const data = await bambooFetch("/products", params);
    // Очікуємо data.items або data.products — підлаштуй!
    const raw = Array.isArray(data?.items) ? data.items :
                Array.isArray(data?.products) ? data.products :
                Array.isArray(data) ? data : [];

    // 2) Мапимо під фронт
    let products = raw.map(mapProduct);

    // 3) Досортування, якщо Bamboo не сортує
    if (sort === "priceAsc")   products.sort((a,b)=> (a.price||0) - (b.price||0));
    if (sort === "priceDesc")  products.sort((a,b)=> (b.price||0) - (a.price||0));
    if (sort === "ratingDesc") products.sort((a,b)=> (b.rating||0) - (a.rating||0));
    // popular — залиш як дає Bamboo (або за reviews)

    // 4) Серверний фільтр за регіонами (якщо Bamboo це ігнорує)
    if (regions) {
      const set = new Set(String(regions).split(",").map(s=>s.trim().toUpperCase()));
      products = products.filter(p => !p.region || set.has(String(p.region).toUpperCase()));
    }

    res.json({
      products,
      total: Number.isFinite(+data?.total) ? +data.total : products.length,
    });
  } catch (e) {
    console.error("GET /api/cards error:", e?.message || e);
    res.json({ products: [], total: 0 }); // graceful fallback
  }
});

export default router;

