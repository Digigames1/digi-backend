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
  const CATALOG_PATH =
    (process.env.BAMBOO_CATALOG_PATH || "/api/integration/v2.0/catalog").replace(
      /\/+$/,
      ""
    ) || "/api/integration/v2.0/catalog";

  const headers = { "Content-Type": "application/json" };
  let authErr = null;
  try {
    Object.assign(headers, await authHeaders());
  } catch (e) {
    authErr = e?.response?.data || e?.message || "authHeaders failed";
  }

  try {
    const url = `${BASE.replace(/\/+$/, "")}${CATALOG_PATH}`;
    const r = await axios.get(url, {
      params: { limit: 5 },
      headers,
      timeout: 15000,
    });
    const data = r.data;
    const status = r.status;

    const items = Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data)
      ? data
      : [];

    return res.json({
      ok: true,
      status,
      count: items.length || 0,
      usedHeaders: Object.keys(headers),
      config: { ...debugAuthConfig() },
    });
  } catch (e) {
    const status = e?.response?.status || null;
    const body = e?.response?.data || e?.message || "error";
    return res.status(200).json({
      ok: false,
      status,
      usedHeaders: Object.keys(headers),
      config: { ...debugAuthConfig() },
      error: authErr
        ? { auth: authErr }
        : typeof body === "object"
        ? body
        : String(body),
    });
  }
});

