import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Mongo connection must be established before registering routes
import { connectMongo } from "./src/db/mongoose.mjs";

// Routers and utilities
import { debugRouter } from "./src/routes/debug.mjs";
import { diagRouter } from "./src/routes/diag.mjs";
import { bambooMatrixRouter } from "./src/routes/bamboo-matrix.mjs";
import { catalogRouter } from "./src/routes/catalog.mjs";
import cardsRouter from "./routers/cards.js";
import searchRouter from "./routers/search.js";
import { bambooExportRouter } from "./src/routes/bamboo-export.mjs";
import { curatedRouter } from "./src/routes/curated.mjs";
import * as fxUtils from "./src/utils/fx.mjs";
import { fxRouter } from "./src/routes/fx.mjs";
import { ordersRouter } from "./src/orders/router.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Wait for Mongo to connect before mounting routes
await connectMongo();
fxUtils.initFxWatcher?.();

// JSON parser for all /api routes
app.use("/api", express.json());

// ДІАГНОСТИКА — піднімаємо першою, без залежностей
app.use("/api/diag", diagRouter);
app.use("/api/diag", bambooMatrixRouter);
app.use("/api", debugRouter);
app.get("/api/health", (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));
app.get("/healthz", (_req, res) => res.json({ ok: true }));

app.use("/api", bambooExportRouter);
app.use("/api", curatedRouter);

// далі — основні роутери
app.use("/api/search", searchRouter);
app.use("/api/cards", cardsRouter);
// catalogRouter тепер включає і /api/catalog, і /api/diag/bamboo/*
app.use("/api", catalogRouter);
app.use("/api", fxRouter);
app.use("/api", ordersRouter);

const envDist = process.env.DIST_DIR && path.resolve(process.env.DIST_DIR);
const candidates = [
  envDist,
  path.join(__dirname, "dist"),
  path.join(__dirname, "frontend", "dist"),
  path.join(__dirname, "client", "dist")
].filter(Boolean);

const found = candidates.find(p => fs.existsSync(p) && fs.existsSync(path.join(p, "index.html")));

console.log("🔎 DIST candidates:", candidates);
console.log("📂 Root dir listing:", fs.readdirSync(__dirname, { withFileTypes: true }).map(d => (d.isDirectory()? d.name + "/" : d.name)));

if (found) {
  console.log("✅ Serving static from:", found);
  app.use(express.static(found));
} else {
  console.error("❌ dist/index.html not found. Ensure build step creates it in the repo root or set DIST_DIR.");
}

app.get("*", (_req, res) => {
  const indexPath = found && path.join(found, "index.html");
  if (indexPath && fs.existsSync(indexPath)) res.sendFile(indexPath);
  else res.status(500).send("dist/index.html not found. Build step failed or wrong path.");
});

// 3) Старт сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on :${PORT}`));

process.on("unhandledRejection", (r) => console.error("[unhandledRejection]", r));
process.on("uncaughtException", (e) => console.error("[uncaughtException]", e));
