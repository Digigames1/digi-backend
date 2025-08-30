import express from "express";
import axios from "axios";

export const bambooMatrixRouter = express.Router();

const BASE =
  process.env.BAMBOO_API_BASE ||
  process.env.BAMBOO_API_URL ||
  process.env.BAMBOO_BASE_URL ||
  "https://api.bamboocardportal.com";

const CID = process.env.BAMBOO_PROD_CLIENT_ID || process.env.BAMBOO_CLIENT_ID || "";
const CSEC = process.env.BAMBOO_PROD_CLIENT_SECRET || process.env.BAMBOO_CLIENT_SECRET || "";
const APIKEY = process.env.BAMBOO_SECRET_KEY || "";     // “API Secret Key” з порталу
const TOKEN_ENV = process.env.BAMBOO_API_TOKEN || "";   // якщо є прямий токен

const CATALOGS = ["/api/integration/v2.0/catalog", "/api/integration/v1.0/catalog"];
const TOKEN_URLS = [
  "/connect/token",
  "/api/integration/connect/token",
];

function niceErr(e) {
  const st = e?.response?.status;
  const body = e?.response?.data;
  return {
    status: st || null,
    error: typeof body === "object" ? (body.reason || body.message || JSON.stringify(body).slice(0,200)) : (body || e?.code || e?.message || "error")
  };
}

async function trySecret(catalogPath, variant) {
  const url = `${BASE.replace(/\/+$/,"")}${catalogPath}`;
  const headers = { "Content-Type": "application/json", ...variant };
  try {
    const { status, data } = await axios.get(url, { headers, timeout: 15000, params: { limit: 5 } });
    const items = Array.isArray(data?.items) ? data.items : Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
    return { ok: true, status, count: items.length || 0 };
  } catch (e) {
    return { ok: false, ...niceErr(e) };
  }
}

async function fetchToken(tokenPath, scope) {
  const tokenUrl = `${BASE.replace(/\/+$/,"")}${tokenPath}`;
  // спроба #1: form client_id+secret
  const form = new URLSearchParams({ grant_type: "client_credentials", client_id: CID, client_secret: CSEC, ...(scope ? { scope } : {}) });
  try {
    const { data } = await axios.post(tokenUrl, form.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 15000
    });
    if (!data?.access_token) throw new Error("no access_token");
    return { ok: true, token: data.access_token, tokenUrl, mode: "form", scope };
  } catch (e1) {
    // спроба #2: Basic
    const basic = Buffer.from(`${CID}:${CSEC}`).toString("base64");
    const body = new URLSearchParams({ grant_type: "client_credentials", ...(scope ? { scope } : {}) });
    try {
      const { data } = await axios.post(tokenUrl, body.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${basic}` },
        timeout: 15000
      });
      if (!data?.access_token) throw new Error("no access_token");
      return { ok: true, token: data.access_token, tokenUrl, mode: "basic", scope };
    } catch (e2) {
      return { ok: false, tokenUrl, modeTried: ["form","basic"], ...niceErr(e2) };
    }
  }
}

async function tryOAuth(catalogPath, tokenPath, scope) {
  const t = await fetchToken(tokenPath, scope);
  if (!t.ok) return { ok: false, auth: t };
  const url = `${BASE.replace(/\/+$/,"")}${catalogPath}`;
  try {
    const { status, data } = await axios.get(url, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t.token}` },
      timeout: 15000, params: { limit: 5 }
    });
    const items = Array.isArray(data?.items) ? data.items : Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
    return { ok: true, status, count: items.length || 0, auth: { tokenUrl: t.tokenUrl, mode: t.mode, scope: t.scope } };
  } catch (e) {
    return { ok: false, ...niceErr(e), auth: { tokenUrl: t.tokenUrl, mode: t.mode, scope: t.scope } };
  }
}

bambooMatrixRouter.get("/bamboo-matrix", async (_req, res) => {
  const results = [];

  // SECRET варіанти заголовків
  const secretVariants = [
    { name: "X-Api-Key", headers: { "X-Api-Key": APIKEY } },
    { name: "X-Api-Key + X-Client-Id", headers: { "X-Api-Key": APIKEY, "X-Client-Id": CID } },
    { name: "X-Secret-Key + X-Client-Id", headers: { "X-Secret-Key": APIKEY, "X-Client-Id": CID } },
  ];

  for (const path of CATALOGS) {
    for (const v of secretVariants) {
      const r = await trySecret(path, v.headers);
      results.push({ mode: "SECRET", catalogPath: path, variant: v.name, usedHeaders: Object.keys(v.headers), ...r });
    }
  }

  // OAUTH: якщо є CID/CSEC
  if (CID && CSEC) {
    const scopes = ["", "api"];
    for (const path of CATALOGS) {
      for (const tok of TOKEN_URLS) {
        for (const sc of scopes) {
          const r = await tryOAuth(path, tok, sc);
          results.push({ mode: "OAUTH", catalogPath: path, tokenPath: tok, scope: sc || null, ...r });
        }
      }
    }
  }

  // BEARER токен напряму, якщо наданий
  if (TOKEN_ENV) {
    for (const path of CATALOGS) {
      const url = `${BASE.replace(/\/+$/,"")}${path}`;
      try {
        const { status, data } = await axios.get(url, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN_ENV}` },
          timeout: 15000, params: { limit: 5 }
        });
        const items = Array.isArray(data?.items) ? data.items : Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        results.push({ mode: "BEARER", catalogPath: path, ok: true, status, count: items.length || 0 });
      } catch (e) {
        results.push({ mode: "BEARER", catalogPath: path, ...niceErr(e) });
      }
    }
  }

  res.json({
    baseUrl: BASE,
    clientIdPresent: Boolean(CID),
    clientSecretPresent: Boolean(CSEC),
    apiKeyPresent: Boolean(APIKEY),
    bearerPresent: Boolean(TOKEN_ENV),
    tried: results.length,
    results
  });
});

