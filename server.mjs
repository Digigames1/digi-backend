import express from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { connectMongo } from "./src/db/mongoose.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// health
app.get("/api/health", (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// 1) Спочатку БД
await connectMongo();

// 2) Потім динамічно роутери (щоб моделі піднялись на вже підключеному інстансі)
const { debugRouter } = await import("./src/routes/debug.mjs");
app.use("/api", debugRouter);

const { bambooExportRouter } = await import("./src/routes/bamboo-export.mjs").catch(() => ({ bambooExportRouter: null }));
if (bambooExportRouter) app.use("/api", bambooExportRouter);

const { curatedRouter } = await import("./src/routes/curated.mjs").catch(() => ({ curatedRouter: null }));
if (curatedRouter) app.use("/api", curatedRouter);

// 3) Статика — ПІСЛЯ /api
const distCandidates = [
  path.join(__dirname, "dist"),
  path.join(__dirname, "frontend", "dist"),
  path.join(__dirname, "client", "dist"),
];
for (const p of distCandidates) console.log("🔎 DIST candidate:", p, "exists:", fs.existsSync(p));
const staticRoot = distCandidates.find(p => fs.existsSync(p));
if (staticRoot) {
  console.log(`✅ Serving static from: ${staticRoot}`);
  app.use(express.static(staticRoot));
  app.get("*", (_req, res) => res.sendFile(path.join(staticRoot, "index.html")));
} else {
  console.warn("⚠️  No static dist folder found");
}

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server on :${PORT}`));

