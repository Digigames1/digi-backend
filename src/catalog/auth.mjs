import axios from "axios";
import { getNextRetryAt, setNextRetryAt, isAfterNow } from "./oauthBackoff.mjs";

// ENV
const AUTH_MODE = (process.env.BAMBOO_AUTH_MODE || "SECRET").toUpperCase(); // SECRET | OAUTH | BEARER | HEADERS
// PROD має пріоритет, але залогуймо, що саме взяли
const CLIENT_ID = process.env.BAMBOO_PROD_CLIENT_ID || process.env.BAMBOO_CLIENT_ID || "";
const CLIENT_SECRET = process.env.BAMBOO_PROD_CLIENT_SECRET || process.env.BAMBOO_CLIENT_SECRET || "";
const SECRET_KEY = process.env.BAMBOO_SECRET_KEY || ""; // для SECRET-режиму
const API_TOKEN = process.env.BAMBOO_API_TOKEN || "";   // для BEARER-режиму

// Токен-ендпоінт можна задати повністю або як BASE+PATH
const BASE =
  process.env.BAMBOO_API_BASE ||
  process.env.BAMBOO_API_URL ||
  process.env.BAMBOO_BASE_URL ||
  "https://api.bamboocardportal.com";
const TOKEN_URL =
  process.env.BAMBOO_TOKEN_URL ||
  `${BASE.replace(/\/+$/, "")}${process.env.BAMBOO_TOKEN_PATH || "/api/integration/connect/token"}`;
const OAUTH_SCOPE = process.env.BAMBOO_OAUTH_SCOPE || ""; // напр. "api" або "catalog.read"

// Назва заголовка з секретним ключем (деякі інсталяції хочуть X-Api-Key)
const KEY_HEADER = (process.env.BAMBOO_KEY_HEADER || "X-Secret-Key").trim();

let cached = { token: null, exp: 0 };

function mask(s) { return s ? s.toString().slice(0,4) + "***" : ""; }

async function fetchToken() {
  // 0) Якщо є активний бекоф — не стукаємо в токен
  const next = await getNextRetryAt();
  if (isAfterNow(next)) {
    const untilIso = new Date(next).toISOString();
    const err = new Error(`token endpoint rate-limited until ${untilIso}`);
    err.status = 429;
    throw err;
  }
  const form = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    ...(OAUTH_SCOPE ? { scope: OAUTH_SCOPE } : {}),
  });
  // 1) спершу — form-варіант
  try {
    const { data } = await axios.post(TOKEN_URL, form.toString(), {
      timeout: 15000,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    if (!data?.access_token) throw new Error("No access_token in token response");
    const now2 = Math.floor(Date.now() / 1000);
    const ttl = Number(data.expires_in || 3600);
    cached = { token: data.access_token, exp: now2 + Math.max(300, ttl - 60) };
    return cached.token;
  } catch (e1) {
    if (e1?.response?.status === 429) {
      await setNextRetryAt(Date.now() + 60_000);
      throw e1;
    }
    // 2) якщо 401 — пробуємо Basic Authorization (деякі OAuth так вимагають)
    if (e1?.response?.status !== 401) throw e1;
    const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
    const body = new URLSearchParams({ grant_type: "client_credentials", ...(OAUTH_SCOPE ? { scope: OAUTH_SCOPE } : {}) });
    try {
      const { data } = await axios.post(TOKEN_URL, body.toString(), {
        timeout: 15000,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${basic}`
        },
      });
      if (!data?.access_token) throw new Error("No access_token in token response");
      const now2 = Math.floor(Date.now() / 1000);
      const ttl = Number(data.expires_in || 3600);
      cached = { token: data.access_token, exp: now2 + Math.max(300, ttl - 60) };
      return cached.token;
    } catch (e2) {
      // Якщо сервер повертає підказку "rate-limited until <ISO>" — збережемо це і шануватимемо
      const msg = e2?.response?.data?.reason || e2?.message || "";
      const m = /rate-limited until ([0-9T:\.\-Z]+)/i.exec(String(msg));
      if (m && m[1]) {
        const until = Date.parse(m[1]); // ms
        if (!Number.isNaN(until)) await setNextRetryAt(until);
      } else if (e2?.response?.status === 429) {
        await setNextRetryAt(Date.now() + 60_000);
      }
      // логування, щоб у логах було видно, які змінні задіяні (без значень)
      console.error(
        "[oauth] token failed",
        { tokenUrl: TOKEN_URL, clientId: mask(CLIENT_ID) },
        "first:", e1?.response?.status || e1?.code || e1?.message,
        "second:", e2?.response?.status || e2?.code || e2?.message
      );
      throw e2;
    }
  }
}

async function getBearer() {
  const now = Math.floor(Date.now() / 1000);
  if (cached.token && cached.exp > now) return cached.token;
  return fetchToken();
}

export async function authHeaders() {
  try {
    switch (AUTH_MODE) {
      case "SECRET": {
        // у SECRET-режимі не ходимо за токеном — лише ставимо заголовки
        const h = { [KEY_HEADER]: SECRET_KEY };
        if (CLIENT_ID) h["X-Client-Id"] = CLIENT_ID;
        return h;
      }
      case "OAUTH": {
        const token = await getBearer();
        return { Authorization: `Bearer ${token}` };
      }
      case "BEARER": {
        return { Authorization: `Bearer ${API_TOKEN}` };
      }
      case "HEADERS": {
        return { "X-Client-Id": CLIENT_ID, "X-Client-Secret": CLIENT_SECRET };
      }
      default:
        return {};
    }
  } catch (e) {
    console.error(
      "[auth] authHeaders failed",
      { mode: AUTH_MODE, tokenUrl: TOKEN_URL },
      e?.response?.status || e?.code || e?.message
    );
    throw e;
  }
}

export function debugAuthConfig() {
  const baseInfo = {
    mode: AUTH_MODE,
    hasClientId: Boolean(CLIENT_ID),
    hasClientSecret: Boolean(CLIENT_SECRET),
    hasSecretKey: Boolean(SECRET_KEY),
    hasApiToken: Boolean(API_TOKEN),
    clientIdUsed: CLIENT_ID ? mask(CLIENT_ID) : "",
  };
  if (AUTH_MODE === "OAUTH") {
    return {
      ...baseInfo,
      tokenUrl: TOKEN_URL,
      scope: OAUTH_SCOPE || null,
    };
  }
  return baseInfo;
}

// Варіанти заголовків для SECRET-режиму
export function secretHeaderVariants() {
  const arr = [];
  // 0) якщо задано ім'я заголовка через ENV — ставимо його першим
  if (KEY_HEADER) {
    const h = { [KEY_HEADER]: SECRET_KEY };
    if (CLIENT_ID) h["X-Client-Id"] = CLIENT_ID;
    arr.push(h);
  }
  // 1) X-Api-Key (+ X-Client-Id)
  arr.push(
    { "X-Api-Key": SECRET_KEY },
    { "X-Api-Key": SECRET_KEY, "X-Client-Id": CLIENT_ID }
  );
  // 2) X-Secret-Key + X-Client-Id
  arr.push({ "X-Secret-Key": SECRET_KEY, "X-Client-Id": CLIENT_ID });

  // Прибери X-Client-Id якщо його немає
  return arr.map((h) => {
    const copy = { ...h };
    if (!CLIENT_ID) delete copy["X-Client-Id"];
    return copy;
  });
}

