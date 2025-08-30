import axios from "axios";
import { authHeaders, debugAuthConfig, secretHeaderVariants } from "./auth.mjs";

const BASE =
  process.env.BAMBOO_API_BASE ||
  process.env.BAMBOO_API_URL ||
  process.env.BAMBOO_BASE_URL ||
  "https://api.bamboocardportal.com";
// за замовчуванням — v2.0
const DEFAULT_CATALOG = "/api/integration/v2.0/catalog";
const CATALOG_PATH = (process.env.BAMBOO_CATALOG_PATH || DEFAULT_CATALOG).replace(/\/+$/, "") || DEFAULT_CATALOG;

export const api = axios.create({
  baseURL: BASE.replace(/\/+$/, ""),
  timeout: 15000,
});

// Допоміжна: зробити GET із перебором заголовків (для SECRET-режиму)
async function getWithSecretHeaderFallback(path, { params } = {}) {
  const variants = secretHeaderVariants();
  let lastErr = null;
  for (const v of variants) {
    try {
      const { data } = await api.get(path, {
        params,
        headers: { "Content-Type": "application/json", ...v },
        timeout: 15000,
      });
      return { data, usedHeaders: Object.keys(v) };
    } catch (e) {
      lastErr = e;
      if (e?.response?.status && e.response.status !== 401 && e.response.status !== 403) {
        // інші статуси не мають сенсу для наступних спроб — віддаємо одразу
        throw e;
      }
      // інакше пробуємо наступний варіант
    }
  }
  throw lastErr || new Error("All SECRET header variants failed");
}

export async function* paginateCatalog(params = {}) {
  let next = null;
  let page = 1;
  while (true) {
    const query = { ...params };
    if ("cursor" in (next || {})) query.cursor = next.cursor;
    else query.page = page;
    try {
      const baseHeaders = await authHeaders(); // повертає або BEARER/HEADERS/SECRET-початкове
      let payload, usedHeaders;
      if (baseHeaders["X-Secret-Key"] || baseHeaders["X-Api-Key"]) {
        // SECRET режим — пробуємо фолбек варіанти
        const r = await getWithSecretHeaderFallback(CATALOG_PATH, { params: query });
        payload = r.data; usedHeaders = r.usedHeaders;
      } else {
        const { data } = await api.get(CATALOG_PATH, {
          params: query,
          headers: { "Content-Type": "application/json", ...baseHeaders },
          timeout: 15000,
        });
        payload = data; usedHeaders = Object.keys(baseHeaders);
      }
      const items = payload?.items || payload?.data || payload || [];
      if (!Array.isArray(items) || !items.length) break;
      yield items;

      next = payload?.next || payload?.pagination?.next || null;
      if (!next && !payload?.pagination) {
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
    ...debugAuthConfig(),
  };
}
