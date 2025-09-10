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
  const debugRouter = (await import(new URL("./src/routes/debug.mjs", import.meta.url))).default;
  const { bambooRouter } = await import("./src/routes/bamboo.mjs");
  const { curatedRouter } = await import("./src/routes/curated.mjs");
  app.use("/api/debug", debugRouter);
  app.use("/api/bamboo", bambooRouter);
  app.use("/api/curated", curatedRouter);

  const names = typeof m.modelNames === 'function' ? m.modelNames() : [];
  console.log('🧩 Models registered:', names.join(', ') || '[]');

  app.listen(PORT, () => {
    console.log(`Server on :${PORT}`);
  });
}

bootstrap().catch(err => {
  console.error('❌ Bootstrap failed:', err?.message || err);
  process.exit(1);
});

