import axios from "axios";

// ENV
const AUTH_MODE = (process.env.BAMBOO_AUTH_MODE || "OAUTH").toUpperCase(); // OAUTH | SECRET | BEARER | HEADERS
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
  `${BASE.replace(/\/+$/, "")}${process.env.BAMBOO_TOKEN_PATH || "/connect/token"}`;

let cached = { token: null, exp: 0 };

function mask(s) { return s ? s.toString().slice(0,4) + "***" : ""; }

async function fetchToken() {
  const form = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });
  // 1) спершу — form-варіант
  try {
    const { data } = await axios.post(TOKEN_URL, form.toString(), {
      timeout: 15000,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    if (!data?.access_token) throw new Error("No access_token in token response");
    const now = Math.floor(Date.now() / 1000);
    const ttl = Number(data.expires_in || 3600);
    cached = { token: data.access_token, exp: now + Math.max(300, ttl - 60) };
    return cached.token;
  } catch (e1) {
    // 2) якщо 401 — пробуємо Basic Authorization (деякі OAuth так вимагають)
    if (e1?.response?.status !== 401) throw e1;
    const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
    const body = new URLSearchParams({ grant_type: "client_credentials" });
    try {
      const { data } = await axios.post(TOKEN_URL, body.toString(), {
        timeout: 15000,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${basic}`
        },
      });
      if (!data?.access_token) throw new Error("No access_token in token response");
      const now = Math.floor(Date.now() / 1000);
      const ttl = Number(data.expires_in || 3600);
      cached = { token: data.access_token, exp: now + Math.max(300, ttl - 60) };
      return cached.token;
    } catch (e2) {
      // логування, щоб у логах було видно, які змінні задіяні (без значень)
      console.error("[oauth] token failed",
        { tokenUrl: TOKEN_URL, clientId: mask(CLIENT_ID), clientSecret: CLIENT_SECRET ? "***" : "" },
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
  switch (AUTH_MODE) {
    case "OAUTH": {
      const token = await getBearer();
      return { Authorization: `Bearer ${token}` };
    }
    case "SECRET":
      return { "X-Client-Id": CLIENT_ID, "X-Secret-Key": SECRET_KEY };
    case "BEARER":
      return { Authorization: `Bearer ${API_TOKEN}` };
    case "HEADERS":
      return { "X-Client-Id": CLIENT_ID, "X-Client-Secret": CLIENT_SECRET };
    default:
      return {};
  }
}

export function debugAuthConfig() {
  return {
    mode: AUTH_MODE,
    hasClientId: Boolean(CLIENT_ID),
    hasClientSecret: Boolean(CLIENT_SECRET),
    hasSecretKey: Boolean(SECRET_KEY),
    hasApiToken: Boolean(API_TOKEN),
    tokenUrl: TOKEN_URL,
    clientIdUsed: CLIENT_ID ? mask(CLIENT_ID) : "",
  };
}

