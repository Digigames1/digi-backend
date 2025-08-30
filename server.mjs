import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { diagRouter } from "./src/routes/diag.mjs";
import { bambooMatrixRouter } from "./src/routes/bamboo-matrix.mjs";
import cardsRouter from "./routers/cards.js";
import searchRouter from "./routers/search.js";
import checkoutRouter from "./routers/checkout.js";
import liqpayRouter from "./routers/liqpay.js";
import catalogRouter from "./routers/catalog.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// ДІАГНОСТИКА — піднімаємо першою, без залежностей
app.use("/api/diag", diagRouter);
app.use("/api/diag", bambooMatrixRouter);
app.get("/healthz", (_req, res) => res.json({ ok: true }));

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

// далі — основні роутери
app.use("/api/search", searchRouter);
app.use("/api/cards", cardsRouter);
app.use("/api/catalog", catalogRouter);
app.use("/api/checkout", express.json(), checkoutRouter);
app.use("/api/liqpay", liqpayRouter);

app.get("*", (_req, res) => {
  const indexPath = found && path.join(found, "index.html");
  if (indexPath && fs.existsSync(indexPath)) res.sendFile(indexPath);
  else res.status(500).send("dist/index.html not found. Build step failed or wrong path.");
});

const PORT = process.env.PORT || 3000;

// БЕЗПЕЧНИЙ СТАРТ: не валимо весь процес, якщо Mongo впав — просто логґуємо
(async () => {
  try {
    const MONGO = process.env.MONGODB_URI;
    if (MONGO) {
      mongoose.connect(MONGO).catch(err => {
        console.error("[mongo] initial connect failed:", err?.message);
      });
    } else {
      console.warn("MONGODB_URI not set");
    }
  } catch (e) {
    console.error("[server] mongo bootstrap error:", e?.message);
  }
  app.listen(PORT, () => console.log(`Server on :${PORT}`));
})();

process.on("unhandledRejection", (r) => console.error("[unhandledRejection]", r));
process.on("uncaughtException", (e) => console.error("[uncaughtException]", e));

