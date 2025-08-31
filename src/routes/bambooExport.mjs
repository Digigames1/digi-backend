import express from "express";
import { exportAllProducts } from "../catalog/bambooExport.mjs";
import BambooDump from "../models/BambooDump.mjs";

export const bambooExportRouter = express.Router();
const TTL_MIN = Math.max(10, Number(process.env.CATALOG_TTL_MIN || 60));

function cacheKey(q) {
  const parts = [
    q.CountryCode || "*",
    q.CurrencyCode || "*",
    q.Name || "",
    q.ModifiedDate || "",
    q.ProductId != null ? `pid:${q.ProductId}` : "",
    q.BrandId != null ? `bid:${q.BrandId}` : "",
    q.TargetCurrency || "",
    `ps:${q.PageSize || ""}`,
    `mp:${q.maxPages || ""}`,
  ];
  return `dump:${parts.join("|")}`;
}

function parseQ(req) {
  return {
    CountryCode: req.query.CountryCode,
    CurrencyCode: req.query.CurrencyCode,
    Name: req.query.Name,
    ModifiedDate: req.query.ModifiedDate,
    ProductId: req.query.ProductId ? Number(req.query.ProductId) : undefined,
    BrandId: req.query.BrandId ? Number(req.query.BrandId) : undefined,
    TargetCurrency: req.query.TargetCurrency,
    PageSize: req.query.PageSize ? Number(req.query.PageSize) : undefined,
    maxPages: req.query.maxPages ? Number(req.query.maxPages) : undefined,
  };
}

async function getRowsWithCache(q, force) {
  const key = cacheKey(q);
  if (!force) {
    const doc = await BambooDump.findOne({ key }).lean();
    const fresh = doc && (Date.now() - new Date(doc.updatedAt).getTime() < TTL_MIN * 60 * 1000);
    if (fresh) return { rows: doc.rows, cached: true, key };
  }
  const rows = await exportAllProducts(q);
  await BambooDump.updateOne(
    { key },
    { $set: { key, filters: q, rows, updatedAt: new Date() } },
    { upsert: true }
  );
  return { rows, cached: false, key };
}

bambooExportRouter.get("/bamboo/export.json", async (req, res) => {
  try {
    const q = parseQ(req);
    const force = String(req.query.force || "") === "1";
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const { rows, cached, key } = await getRowsWithCache(q, force);
    const out = Array.isArray(rows) ? (limit ? rows.slice(0, limit) : rows) : [];
    res.json({ ok: true, count: out.length, cached, key, filters: q, rows: out });
  } catch (e) {
    res.status(200).json({ ok: false, error: e?.message || "export failed" });
  }
});

bambooExportRouter.get("/bamboo/export.ndjson", async (req, res) => {
  try {
    const q = parseQ(req);
    const force = String(req.query.force || "") === "1";
    const { rows } = await getRowsWithCache(q, force);
    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    for (const r of rows) res.write(JSON.stringify(r) + "\n");
    res.end();
  } catch (e) {
    res.status(200).json({ ok: false, error: e?.message || "ndjson failed" });
  }
});

bambooExportRouter.get("/bamboo/export.csv", async (req, res) => {
  try {
    const q = parseQ(req);
    const force = String(req.query.force || "") === "1";
    const { rows } = await getRowsWithCache(q, force);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=\"bamboo_export.csv\"");
    const header = ["brandName","brandId","productId","productName","priceMin","priceMax","priceCurrency","countryCode","currencyCode","modifiedDate"];
    res.write(header.join(",") + "\n");
    for (const r of rows) {
      const line = header.map(k => `"${String(r[k] ?? "").replace(/"/g,'""')}"`).join(",");
      res.write(line + "\n");
    }
    res.end();
  } catch (e) {
    res.status(200).json({ ok: false, error: e?.message || "csv failed" });
  }
});
