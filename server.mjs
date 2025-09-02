// server.mjs
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { connectMongo } from "./src/db/mongoose.mjs";

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
(async () => {
  try {
    await connectMongo();

    // ІМПОРТИ РОУТІВ ПІСЛЯ КОНЕКТУ
    const { debugRouter } = await import("./src/routes/debug.mjs");
    app.use("/api/debug", debugRouter);

    // інші роутери:
    // const { bambooRouter } = await import("./src/routes/bamboo.mjs");
    // const { curatedRouter } = await import("./src/routes/curated.mjs");
    // app.use("/api/bamboo", bambooRouter);
    // app.use("/api/curated", curatedRouter);

    app.listen(PORT, () => {
      console.log(`Server on :${PORT}`);
    });
  } catch (err) {
    console.error("❌ Startup failed:", err?.message || err);
    process.exit(1);
  }
})();

