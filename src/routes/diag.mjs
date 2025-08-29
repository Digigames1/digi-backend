import express from "express";
import { api, getEgressIp, getBambooConfig } from "../catalog/bambooClient.mjs";

export const diagRouter = express.Router();

diagRouter.get("/bamboo", async (req, res) => {
  const cfg = getBambooConfig();
  const ip = await getEgressIp();

  try {
    const { data, status } = await api.get(cfg.catalogPath, { params: { limit: 5 } });
    const items = Array.isArray(data?.items) ? data.items :
                  Array.isArray(data?.data) ? data.data :
                  Array.isArray(data) ? data : [];
    const preview = items.slice(0, 5).map(it => ({
      id: it.id ?? it.productId ?? it.sku ?? null,
      name: it.name ?? it.title ?? it.displayName ?? null,
    }));

    return res.json({
      ok: true,
      status,
      egressIp: ip,
      config: cfg,
      count: items.length || 0,
      preview,
    });
  } catch (e) {
    const status = e?.response?.status || null;
    const body = e?.response?.data || e?.message || "error";
    return res.status(200).json({
      ok: false,
      status,
      egressIp: ip,
      config: cfg,
      error: typeof body === "object" ? body : String(body),
    });
  }
});

diagRouter.get("/egress-ip", async (req, res) => {
  try {
    const ip = await getEgressIp();
    if (!ip) throw new Error("failed to fetch ip");
    return res.json({ ip });
  } catch (e) {
    console.error("[diag] egress-ip error:", e?.code || e?.message);
    return res.status(500).json({ ip: null, error: e?.message || "failed" });
  }
});

diagRouter.get("/", async (req, res) => {
  try {
    const ip = await getEgressIp();
    if (!ip) throw new Error("failed to fetch ip");
    return res.json({ ip });
  } catch (e) {
    console.error("[diag] ip error:", e?.code || e?.message);
    return res.status(500).json({ ip: null, error: e?.message || "failed" });
  }
});

