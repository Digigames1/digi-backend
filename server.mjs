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
  const m = await connectMongo();
  // Імпортуємо роутери
  const { default: debugRouter } = await import("./src/routes/debug.mjs");
  const { bambooExportRouter } = await import("./src/routes/bamboo-export.mjs");
  const { bambooStatusRouter } = await import("./src/routes/bamboo-status.mjs");
  const { curatedRouter } = await import("./src/routes/curated.mjs");
  app.use("/api", debugRouter);
  app.use("/api", bambooExportRouter);
  app.use("/api", bambooStatusRouter);
  app.use("/api", curatedRouter);

  const names = typeof m.modelNames === 'function' ? m.modelNames() : [];
  console.log('🧩 Models registered:', names.join(', ') || '[]');

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

