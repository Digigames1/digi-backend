import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE = process.env.OAUTH_BACKOFF_PATH || path.join(__dirname, "..", "data", "oauth-backoff.json");

async function read() {
  try {
    const raw = await fs.readFile(STORE, "utf8");
    return JSON.parse(raw);
  } catch {
    return { nextRetryAt: 0 }; // ms epoch
  }
}

async function write(doc) {
  await fs.mkdir(path.dirname(STORE), { recursive: true }).catch(() => {});
  await fs.writeFile(STORE, JSON.stringify(doc, null, 2), "utf8");
}

export async function getNextRetryAt() {
  const { nextRetryAt } = await read();
  return Number(nextRetryAt || 0);
}

export async function setNextRetryAt(tsMs) {
  const val = Math.max(0, Number(tsMs || 0));
  await write({ nextRetryAt: val });
}

export async function clearBackoff() {
  await write({ nextRetryAt: 0 });
}

export function isAfterNow(tsMs) {
  return Number(tsMs || 0) > Date.now();
}

