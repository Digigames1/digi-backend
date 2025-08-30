import express from "express";
import axios from "axios";

// Якщо у проєкті вже є bambooClient — не чіпай його імпорти тут.
// Ми йдемо напряму, щоб цей роут працював навіть якщо інші модулі падають.

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
    "";
  const CATALOG_PATH = (process.env.BAMBOO_CATALOG_PATH || "/catalog").replace(/\/+$/, "") || "/catalog";
  const AUTH_MODE = (process.env.BAMBOO_AUTH_MODE ||
    (process.env.BAMBOO_API_TOKEN ? "BEARER" : (process.env.BAMBOO_SECRET_KEY ? "SECRET" : "HEADERS"))
  ).toUpperCase();
  const CLIENT_ID = process.env.BAMBOO_PROD_CLIENT_ID || process.env.BAMBOO_CLIENT_ID || "";
  const CLIENT_SECRET = process.env.BAMBOO_PROD_CLIENT_SECRET || process.env.BAMBOO_CLIENT_SECRET || "";
  const TOKEN = process.env.BAMBOO_API_TOKEN || "";
  const SECRET_KEY = process.env.BAMBOO_SECRET_KEY || "";

  const headers = { "Content-Type": "application/json" };
  switch (AUTH_MODE) {
    case "BEARER":
      headers.Authorization = `Bearer ${TOKEN}`;
      break;
    case "SECRET":
      headers["X-Secret-Key"] = SECRET_KEY;
      if (CLIENT_ID) headers["X-Client-Id"] = CLIENT_ID;
      break;
    default: // HEADERS
      headers["X-Client-Id"] = CLIENT_ID;
      headers["X-Client-Secret"] = CLIENT_SECRET;
  }
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
      config: {
        baseUrl: BASE,
        catalogPath: CATALOG_PATH,
        authMode: AUTH_MODE,
        headers: headerKeys,
        hasToken: Boolean(TOKEN),
        hasSecretKey: Boolean(SECRET_KEY),
        hasClientId: Boolean(CLIENT_ID),
        hasClientSecret: Boolean(CLIENT_SECRET),
      },
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
      config: {
        baseUrl: BASE,
        catalogPath: CATALOG_PATH,
        authMode: AUTH_MODE,
        headers: headerKeys,
        hasToken: Boolean(TOKEN),
        hasSecretKey: Boolean(SECRET_KEY),
        hasClientId: Boolean(CLIENT_ID),
        hasClientSecret: Boolean(CLIENT_SECRET),
      },
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
      config: {
        baseUrl: BASE,
        catalogPath: CATALOG_PATH,
        authMode: AUTH_MODE,
        headers: headerKeys,
        // підкажемо, що саме активовано (без значень ключів)
        hasToken: Boolean(TOKEN),
        hasSecretKey: Boolean(SECRET_KEY),
        hasClientId: Boolean(CLIENT_ID),
        hasClientSecret: Boolean(CLIENT_SECRET),
      },
      error: typeof body === "object" ? body : String(body)
    });
  }
});

