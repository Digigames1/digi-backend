// server.mjs — unified startup with guaranteed Mongo init before routes

import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";

// 1) Mongo singleton
import { connectMongo } from "./src/db/mongoose.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Basic JSON middleware for APIs
app.use(express.json());

// --- Health / ping early (no DB needed)
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// 2) Connect Mongo BEFORE importing any routes that use mongoose
try {
  await connectMongo(); // <-- CRITICAL
} catch (e) {
  console.error("\u274c Mongo connect failed at startup:", e?.message || e);
  // Не падаємо: API зможуть показати діагностику
}

// 3) Now import routers dynamically (after DB is ready)
const { debugRouter } = await import("./src/routes/debug.mjs").catch(() => ({ debugRouter: null }));
if (debugRouter) app.use("/api", debugRouter);

const { bambooExportRouter } = await import("./src/routes/bamboo-export.mjs").catch(() => ({ bambooExportRouter: null }));
if (bambooExportRouter) app.use("/api", bambooExportRouter);

const { curatedRouter } = await import("./src/routes/curated.mjs").catch(() => ({ curatedRouter: null }));
if (curatedRouter) app.use("/api", curatedRouter);

// 4) Static assets (after /api so SPA doesn't swallow API routes)
const distCandidates = [
  path.join(__dirname, "dist"),
  path.join(__dirname, "frontend", "dist"),
  path.join(__dirname, "client", "dist"),
];

const staticRoot = distCandidates.find(p => {
  try { return require('node:fs').existsSync(p); } catch { return false; }
});

if (staticRoot) {
  console.log(`\u2705 Serving static from: ${staticRoot}`);
  app.use(express.static(staticRoot));
} else {
  console.warn("\u26a0\ufe0f  No static dist folder found");
}

// 5) SPA fallback (optional) — keep it AFTER API routes
app.get("*", (_req, res, next) => {
  if (!staticRoot) return next();
  res.sendFile(path.join(staticRoot, "index.html"));
});

// 6) Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server on :${PORT}`);
});
