import axios from "axios";

// ---- base + paths ----
const BASE =
  process.env.BAMBOO_API_BASE ||
  process.env.BAMBOO_API_URL ||
  process.env.BAMBOO_BASE_URL ||
  "";
// дозволяємо перевизначати шлях каталогу з ENV (за замовчуванням /catalog)
const CATALOG_PATH = (process.env.BAMBOO_CATALOG_PATH || "/catalog").replace(/\/+$/, "") || "/catalog";

// ---- auth modes ----
// Підтримувані режими:
//  - BEARER : Authorization: Bearer <token> (BAMBOO_API_TOKEN)
//  - SECRET : X-Secret-Key: <key> (BAMBOO_SECRET_KEY)
//  - HEADERS: X-Client-Id / X-Client-Secret (BAMBOO_CLIENT_ID / BAMBOO_CLIENT_SECRET)
const AUTH_MODE = (process.env.BAMBOO_AUTH_MODE ||
  (process.env.BAMBOO_API_TOKEN ? "BEARER" : (process.env.BAMBOO_SECRET_KEY ? "SECRET" : "HEADERS"))
).toUpperCase();

const CLIENT_ID = process.env.BAMBOO_PROD_CLIENT_ID || process.env.BAMBOO_CLIENT_ID || "";
const CLIENT_SECRET = process.env.BAMBOO_PROD_CLIENT_SECRET || process.env.BAMBOO_CLIENT_SECRET || "";
const TOKEN = process.env.BAMBOO_API_TOKEN || "";
const SECRET_KEY = process.env.BAMBOO_SECRET_KEY || "";

if (!BASE) console.error("[bamboo] BASE url is EMPTY. Set BAMBOO_API_URL/BAMBOO_BASE_URL.");
if (AUTH_MODE === "HEADERS" && (!CLIENT_ID || !CLIENT_SECRET)) {
  console.warn("[bamboo] CLIENT_ID/CLIENT_SECRET missing — check ENV.");
}
if (AUTH_MODE === "BEARER" && !TOKEN) {
  console.warn("[bamboo] BAMBOO_API_TOKEN is empty — check ENV.");
}
if (AUTH_MODE === "SECRET" && !SECRET_KEY) {
  console.warn("[bamboo] BAMBOO_SECRET_KEY is empty — check ENV.");
}

const headers = { "Content-Type": "application/json" };
switch (AUTH_MODE) {
  case "BEARER":
    headers.Authorization = `Bearer ${TOKEN}`;
    break;
  case "SECRET":
    headers["X-Secret-Key"] = SECRET_KEY;
    // деякі інсталяції також вимагають Client-Id поряд із Secret — залишимо умовно:
    if (CLIENT_ID) headers["X-Client-Id"] = CLIENT_ID;
    break;
  default: // HEADERS
    headers["X-Client-Id"] = CLIENT_ID;
    headers["X-Client-Secret"] = CLIENT_SECRET;
}

export const api = axios.create({
  baseURL: BASE.replace(/\/+$/, ""),
  timeout: 15000,
  headers,
});

export async function* paginateCatalog(params = {}) {
  let next = null;
  let page = 1;
  while (true) {
    const query = { ...params };
    if ("cursor" in (next || {})) query.cursor = next.cursor;
    else query.page = page;

    try {
      const { data } = await api.get(CATALOG_PATH, { params: query });
      const items = data?.items || data?.data || data || [];
      if (!Array.isArray(items) || !items.length) break;
      yield items;

      next = data?.next || data?.pagination?.next || null;
      if (!next && !data?.pagination) {
        if (items.length < (params.limit || 100)) break;
        page += 1;
      } else if (!next) break;
    } catch (e) {
      const st = e?.response?.status;
      const body = e?.response?.data;
      console.error("[bamboo] fetch error:",
        st || e?.code || e?.message,
        body && typeof body === "object" ? JSON.stringify(body).slice(0, 400) : body || ""
      );
      throw e;
    }
  }
}

// утилітка для діагностики IP
export async function getEgressIp() {
  try {
    const { data } = await axios.get("https://api.ipify.org?format=json", { timeout: 5000 });
    return data?.ip || null;
  } catch {
    return null;
  }
}

export function getBambooConfig() {
  return {
    baseUrl: BASE,
    catalogPath: CATALOG_PATH,
    authMode: AUTH_MODE,
    hasClientId: Boolean(CLIENT_ID),
    hasClientSecret: Boolean(CLIENT_SECRET),
    hasToken: Boolean(TOKEN),
    hasSecretKey: Boolean(SECRET_KEY),
  };
}

