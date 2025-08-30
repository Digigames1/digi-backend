import axios from "axios";
import { authHeaders, debugAuthConfig } from "./auth.mjs";

const BASE =
  process.env.BAMBOO_API_BASE ||
  process.env.BAMBOO_API_URL ||
  process.env.BAMBOO_BASE_URL ||
  "https://api.bamboocardportal.com";

// За замовчуванням — v2.0 (перевизначай через ENV)
const CATALOG_PATH =
  (process.env.BAMBOO_CATALOG_PATH || "/api/integration/v2.0/catalog").replace(
    /\/+$/,
    ""
  ) || "/api/integration/v2.0/catalog";

export const api = axios.create({
  baseURL: BASE.replace(/\/+$/, ""),
  timeout: 15000,
});

export async function* paginateCatalog(params = {}) {
  let next = null;
  let page = 1;

  while (true) {
    const query = { ...params };
    if ("cursor" in (next || {})) query.cursor = next.cursor;
    else query.page = page;

    try {
      const headers = await authHeaders();
      const { data } = await api.get(CATALOG_PATH, {
        params: query,
        headers: { "Content-Type": "application/json", ...headers },
        timeout: 15000,
      });
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
      console.error(
        "[bamboo] fetch error:",
        st || e?.code || e?.message,
        body && typeof body === "object"
          ? JSON.stringify(body).slice(0, 400)
          : body || ""
      );
      throw e;
    }
  }
}

export async function getEgressIp() {
  try {
    const { data } = await axios.get("https://api.ipify.org?format=json", {
      timeout: 5000,
    });
    return data?.ip || null;
  } catch {
    return null;
  }
}

export function getBambooConfig() {
  return {
    baseUrl: BASE,
    catalogPath: CATALOG_PATH,
    ...debugAuthConfig(),
  };
}
