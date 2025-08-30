import express from "express";
import axios from "axios";
import { getBambooConfig, fetchCatalogRaw } from "../catalog/bambooClient.mjs";

export const diagRouter = express.Router();

// Найпростіший healthcheck, не залежить ні від чого
diagRouter.get("/healthz", (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// Поточний egress IP (для whitelist у Bamboo)
diagRouter.get("/egress-ip", async (_req, res) => {
  try {
    const { data } = await axios.get("https://api.ipify.org?format=json", { timeout: 5000 });
    res.json({ ip: data?.ip || null });
  } catch (e) {
    res.status(500).json({ ip: null, error: e?.message || "failed" });
  }
});

// GET /api/diag/bamboo
// Проксить у Bamboo РІВНО ті query-параметри, що прийшли
diagRouter.get("/bamboo", async (req, res) => {
  try {
    // Витягуємо поля з точними назвами (як у V2)
    const q = {
      CurrencyCode: req.query.CurrencyCode,
      CountryCode: req.query.CountryCode,
      Name: req.query.Name,
      ModifiedDate: req.query.ModifiedDate,
      ProductId: req.query.ProductId ? Number(req.query.ProductId) : undefined,
      BrandId: req.query.BrandId ? Number(req.query.BrandId) : undefined,
      TargetCurrency: req.query.TargetCurrency,
      PageSize: req.query.PageSize ? Number(req.query.PageSize) : undefined,
      PageIndex: req.query.PageIndex ? Number(req.query.PageIndex) : undefined,
    };

    const { data, status, usedHeaders } = await fetchCatalogRaw(q);
    const items = Array.isArray(data?.items) ? data.items : [];
    return res.json({
      ok: status === 200,
      status,
      count: items.length,
      usedHeaders,
      config: getBambooConfig(),
      querySent: q,
      preview: items.slice(0, 3),
    });
  } catch (e) {
    const status = e?.response?.status || 500;
    return res.status(200).json({
      ok: false,
      status,
      usedHeaders: undefined,
      config: getBambooConfig(),
      error: e?.response?.data || e?.message || "failed",
    });
  }
});

// POST /api/diag/bamboo/refresh
// (залишити вашу реалізацію кешу; головне — читати ті самі параметри і передавати їх у внутрішній фетч)
diagRouter.post("/bamboo/refresh", async (req, res) => {
  try {
    const q = {
      CurrencyCode: req.query.CurrencyCode,
      CountryCode: req.query.CountryCode,
      Name: req.query.Name,
      ModifiedDate: req.query.ModifiedDate,
      ProductId: req.query.ProductId ? Number(req.query.ProductId) : undefined,
      BrandId: req.query.BrandId ? Number(req.query.BrandId) : undefined,
      TargetCurrency: req.query.TargetCurrency,
      PageSize: req.query.PageSize ? Number(req.query.PageSize) : undefined,
      PageIndex: req.query.PageIndex ? Number(req.query.PageIndex) : undefined,
    };

    // TODO: тут виклик вашого сервісу кешу з q
    // await refreshCatalogWithQuery(q) — якщо є
    const { data, status } = await fetchCatalogRaw(q); // мінімально підтягнемо й повернемо

    return res.json({
      ok: status === 200,
      status,
      querySent: q,
      cached: false, // якщо реалізований кеш — оновити відповідно
    });
  } catch (e) {
    const status = e?.response?.status || 500;
    return res.status(200).json({
      ok: false,
      status,
      error: e?.response?.data || e?.message || "failed",
    });
  }
});

