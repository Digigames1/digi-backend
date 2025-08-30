import express from "express";
import axios from "axios";
import { authHeaders, debugAuthConfig } from "../catalog/auth.mjs";

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
  Object.assign(headers, await authHeaders());
  const headerKeys = Object.keys(headers);

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
    const { data, status } = await axios.get(
      `${BASE.replace(/\/+$/, "")}${CATALOG_PATH}`,
      { params: { limit: 5 }, headers, timeout: 15000 }
    );
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
      error: typeof body === "object" ? body : String(body)
    });
  }
});

