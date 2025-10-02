// server.mjs
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { connectMongo, mongoose } from "./src/db/mongoose.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());

// Статика (Vite build)
const distCandidates = [
  path.join(__dirname, "dist"),
  path.join(__dirname, "frontend", "dist"),
  path.join(__dirname, "client", "dist")
];

let served = false;
for (const p of distCandidates) {
  try {
    const exists = await (async () => {
      try { return (await import("node:fs/promises")).stat(p).then(s => s.isDirectory()).catch(() => false); } catch { return false; }
    })();
    console.log(`🔎 DIST candidate: ${p} exists: ${exists}`);
    if (exists && !served) {
      app.use(express.static(p));
      console.log(`✅ Serving static from: ${p}`);
      served = true;
    }
  } catch {}
}

const PORT = process.env.PORT || 10000;

// Старт з'єднання і роутів
async function bootstrap() {
  // ---- Mongo bootstrap with fallbacks ----
  const mongoUri =
    process.env.MONGODB_URI ||
    process.env.DB_URL ||
    process.env.MONGO_URL ||
    "";

  const mongoDbName =
    process.env.MONGODB_DB_NAME ||
    process.env.DB_NAME ||
    undefined;

  if (!mongoUri) {
    throw new Error(
      "Bootstrap failed: no Mongo URI found. Expected MONGODB_URI or DB_URL (or MONGO_URL)."
    );
  }

  try {
    const conn = await connectMongo(mongoUri, mongoDbName);
    const name = conn?.name || mongoose?.connection?.name || "(unknown)";
    console.log("Mongo connected:", name);
  } catch (e) {
    console.error("❌ Mongo connect failed at startup:", e?.message || e);
    throw e;
  }

  const { default: mongooseDefault } = await import("mongoose");
  const { BambooDump } = await import("./src/models/BambooDump.mjs");
  const { BambooPage } = await import("./src/models/BambooPage.mjs");
  const { CuratedCatalog } = await import("./src/models/CuratedCatalog.mjs");

  // best-effort indexes (не падаємо, якщо щось)
  for (const m of [BambooDump, BambooPage, CuratedCatalog]) {
    if (m?.init) { try { await m.init(); } catch {} }
  }

  console.log("🧩 Models registered:", Object.keys(mongooseDefault.models || {}));

  // Імпортуємо роутери
  const { debugEnvRouter } = await import("./src/routes/debug-env.mjs");
  const { debugModelRouter } = await import("./src/routes/debug-model.mjs");
  const { default: debugRouter } = await import("./src/routes/debug.mjs");
  const { debugNativeRouter } = await import("./src/routes/debug-native.mjs");
  const { bambooExportRouter } = await import("./src/routes/bamboo-export.mjs");
  const { bambooDumpsRouter } = await import("./src/routes/bamboo-dumps.mjs");
  const { bambooItemsRouter } = await import("./src/routes/bamboo-items.mjs");
  const { bambooPagesRouter } = await import("./src/routes/bamboo-pages.mjs");
  const { bambooPeekRouter } = await import("./src/routes/bamboo-peek.mjs");
  const { bambooStatusRouter } = await import("./src/routes/bamboo-status.mjs");
  const { curatedRouter } = await import("./src/routes/curated.mjs");
  app.use("/api", debugEnvRouter);
  app.use("/api", debugModelRouter);
  app.use("/api", debugRouter);
  app.use("/api", debugNativeRouter);
  app.use("/api", bambooExportRouter);
  app.use("/api", bambooDumpsRouter);
  app.use("/api", bambooItemsRouter);
  app.use("/api", bambooPagesRouter);
  app.use("/api", bambooPeekRouter);
  app.use("/api", bambooStatusRouter);
  app.use("/api", curatedRouter);

  app.listen(PORT, () => {
    console.log(`Server on :${PORT}`);
  });

  // Auto-refresh curated cache on interval (optional)
  if ((process.env.BAMBOO_AUTO_REFRESH_CRON || "disabled") === "enabled") {
    const minutes = Math.max(5, parseInt(process.env.BAMBOO_AUTO_REFRESH_INTERVAL_MIN || "60", 10));
    const currencies = (process.env.BAMBOO_AUTO_REFRESH_CURRENCIES || "USD,EUR,CAD,AUD").split(",").map(s=>s.trim());
    const tick = async () => {
      try {
        const { buildCurated } = await import("./src/services/curate.mjs");
        await buildCurated({ currencies });
        console.log(`[auto-refresh] curated updated for ${currencies.join(",")}`);
      } catch (e) {
        console.warn("[auto-refresh] failed:", e?.message || e);
      }
    };
    setInterval(tick, minutes * 60 * 1000);
    tick();
  }
}

bootstrap().catch(err => {
  console.error('❌ Bootstrap failed:', err?.message || err);
  process.exit(1);
});

