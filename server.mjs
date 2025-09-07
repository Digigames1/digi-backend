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
  try {
    await connectMongo();

    // Реєструємо моделі після підключення
    const { CuratedCatalog } = await import("./src/models/CuratedCatalog.mjs");
    const { BambooDump } = await import("./src/models/BambooDump.mjs");

    // Імпортуємо роутери
    const { debugRouter } = await import("./src/routes/debug.mjs");
    const { bambooRouter } = await import("./src/routes/bamboo.mjs");
    const { curatedRouter } = await import("./src/routes/curated.mjs");
    app.use("/api/debug", debugRouter);
    app.use("/api/bamboo", bambooRouter);
    app.use("/api/curated", curatedRouter);

    const modelNames =
      typeof mongoose.modelNames === "function" ? mongoose.modelNames() : [];
    console.log("\uD83E\uDDE9 Models registered:", modelNames.join(", ") || "[]");

    app.listen(PORT, () => {
      console.log(`Server on :${PORT}`);
    });
  } catch (err) {
    console.error("❌ Startup failed:", err?.message || err);
    process.exit(1);
  }
}

bootstrap().catch((e) => {
  console.error("❌ Bootstrap failed:", e?.message || e);
  process.exit(1);
});

