import express from "express";
import axios from "axios";
import BambooDump from "../models/BambooDump.mjs";

export const bambooExportRouter = express.Router();

/** Побудова BASIC заголовка з ENV */
function basicAuthHeader() {
  const id = process.env.BAMBOO_CLIENT_ID;
  const secret = process.env.BAMBOO_CLIENT_SECRET;
  if (!id || !secret) throw new Error("BAMBOO_CLIENT_ID / BAMBOO_CLIENT_SECRET not set");
  const token = Buffer.from(`${id}:${secret}`).toString("base64");
  return `Basic ${token}`;
}

/** Читаємо базові URL-и з ENV */
function bambooBase() {
  const base = process.env.BAMBOO_BASE_URL || process.env.BAMBOO_API_URL || "https://api.bamboocardportal.com";
  const path = process.env.BAMBOO_CATALOG_PATH || "/api/integration/v2.0/catalog";
  return { base, path };
}

/** Запит однієї сторінки каталогу */
async function fetchCatalogPage({ PageSize = 100, PageIndex = 0, params = {} }) {
  const { base, path } = bambooBase();
  const url = new URL(path, base);
  url.searchParams.set("PageSize", String(PageSize));
  url.searchParams.set("PageIndex", String(PageIndex));
  // Додаткові фільтри за потребою:
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") url.searchParams.set(k, String(v));
  }

  const res = await axios.get(url.toString(), {
    timeout: 20000,
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/json",
    },
    validateStatus: (s) => s >= 200 && s < 500,
  });

  if (res.status === 401) throw new Error("Bamboo 401: Unauthorized (check client id/secret)");
  if (res.status === 429) throw new Error("Bamboo 429: Too many requests");
  if (res.status >= 400) throw new Error(`Bamboo ${res.status}: ${res.statusText}`);

  return res.data; // очікуємо shape: { pageIndex, pageSize, count, items: [{ name, products: [...] }...] }
}

/** GET /api/bamboo/export.json?PageSize=100&maxPages=30&force=1 */
bambooExportRouter.get("/bamboo/export.json", async (req, res) => {
  try {
    const PageSize = Math.max(1, Math.min(500, Number(req.query.PageSize) || 100));
    const maxPages = Math.max(1, Math.min(100, Number(req.query.maxPages) || 30));
    const force = String(req.query.force || "") === "1";

    const dumpKey = `catalog:v2:ps${PageSize}:mp${maxPages}`;
    const existing = await BambooDump.findOne({ key: dumpKey }).lean();
    if (existing && !force) {
      return res.json({ ok: true, cached: true, key: dumpKey, rows: existing.rows.length, updatedAt: existing.updatedAt });
    }

    let allItems = [];
    let total = 0;

    for (let page = 0; page < maxPages; page++) {
      const data = await fetchCatalogPage({ PageSize, PageIndex: page });
      const items = Array.isArray(data?.items) ? data.items : [];
      allItems.push(...items);
      total = Number.isFinite(+data?.count) ? +data.count : total;

      // якщо повернули менше, ніж PageSize — значить це остання
      if (items.length < PageSize) break;

      // маленька пауза, щоб не відловлювати 429
      await new Promise((r) => setTimeout(r, 400));
    }

    await BambooDump.updateOne(
      { key: dumpKey },
      { $set: { key: dumpKey, filters: { PageSize, maxPages }, rows: allItems, updatedAt: new Date() } },
      { upsert: true }
    );

    res.json({ ok: true, cached: false, key: dumpKey, rows: allItems.length, total });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

export default bambooExportRouter;
