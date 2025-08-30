import express from "express";
import axios from "axios";
import { authHeaders, debugAuthConfig, secretHeaderVariants } from "../catalog/auth.mjs";

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

// Діагностика Bamboo: гнучка авторизація + детальний статус
diagRouter.get("/bamboo", async (_req, res) => {
  const BASE =
    process.env.BAMBOO_API_BASE ||
    process.env.BAMBOO_API_URL ||
    process.env.BAMBOO_BASE_URL ||
    "https://api.bamboocardportal.com";
  const CATALOG_PATH = (process.env.BAMBOO_CATALOG_PATH || "/api/integration/v2.0/catalog").replace(/\/+$/, "") || "/api/integration/v2.0/catalog";

    const headers = { "Content-Type": "application/json" };
    let authErr = null, usedHeaderNames = [];
    try { Object.assign(headers, await authHeaders()); }
    catch (e) { authErr = e?.response?.data || e?.message || "authHeaders failed"; }

  let ip = null;
  try {
    const ipRes = await axios.get("https://api.ipify.org?format=json", { timeout: 5000 });
    ip = ipRes.data?.ip || null;
  } catch {}

  if (!BASE) {
    return res.status(200).json({
      ok: false,
      egressIp: ip,
      config: { baseUrl: BASE, catalogPath: CATALOG_PATH, ...debugAuthConfig() },
      error: "BASE url is empty. Set BAMBOO_API_URL/BAMBOO_BASE_URL in Render.",
    });
  }

  try {
    let data, status;
    const url = `${BASE.replace(/\/+$/, "")}${CATALOG_PATH}`;
    if ("X-Secret-Key" in headers || "X-Api-Key" in headers) {
      // SECRET режим: перебір варіантів
      const variants = secretHeaderVariants();
      let lastErr;
      for (const v of variants) {
        try {
          const r = await axios.get(url, { params: { limit: 5 }, headers: { "Content-Type": "application/json", ...v }, timeout: 15000 });
          data = r.data; status = r.status; usedHeaderNames = Object.keys(v); break;
        } catch (e) {
          lastErr = e;
          if (e?.response?.status && e.response.status !== 401 && e.response.status !== 403) throw e;
        }
      }
      if (!status) throw lastErr || new Error("All SECRET header variants failed");
    } else {
      const r = await axios.get(url, { params: { limit: 5 }, headers, timeout: 15000 });
      data = r.data; status = r.status; usedHeaderNames = Object.keys(headers);
    }
    const items = Array.isArray(data?.items) ? data.items :
                  Array.isArray(data?.data) ? data.data :
                  Array.isArray(data) ? data : [];
    const preview = items.slice(0, 5).map(it => ({
      id: it?.id ?? it?.productId ?? it?.sku ?? null,
      name: it?.name ?? it?.title ?? it?.displayName ?? null
    }));
    res.json({
      ok: true,
      status,
      egressIp: ip,
      config: { baseUrl: BASE, catalogPath: CATALOG_PATH, ...debugAuthConfig() },
      count: items.length || 0,
      usedHeaders: usedHeaderNames,
      preview
    });
  } catch (e) {
    const status = e?.response?.status || null;
    const body = e?.response?.data || e?.message || "error";
    res.status(200).json({
      ok: false,
      status,
      egressIp: ip,
      config: { baseUrl: BASE, catalogPath: CATALOG_PATH, ...debugAuthConfig() },
      error: authErr ? { auth: authErr } : (typeof body === "object" ? body : String(body))
    });
  }
});

