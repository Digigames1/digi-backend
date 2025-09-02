import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { connectMongo } from "./src/db/mongoose.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// JSON + urlencoded
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// 1) Connect to Mongo FIRST
await connectMongo();

// 2) Warm up mongoose models BEFORE routes
const modelIndex = await import("./src/models/index.mjs");
if (modelIndex?.default) {
  console.log("🧩 Models registered:", modelIndex.default.join(", "));
}

// 3) Only now import and mount routes (all routers import models safely)
const { debugRouter } = await import("./src/routes/debug.mjs");
app.use("/api", debugRouter);

// mount your other routers AFTER debug if needed
// e.g.
// const { bambooRouter } = await import("./src/routers/bamboo.js");
// app.use("/api", bambooRouter);

// static
const distCandidates = [
  path.join(__dirname, "dist"),
  path.join(__dirname, "frontend", "dist"),
  path.join(__dirname, "client", "dist"),
];

let served = false;
for (const p of distCandidates) {
  try {
    const ok = await fsExists(p);
    console.log(`🔎 DIST candidate: ${p} exists: ${ok}`);
    if (ok && !served) {
      app.use(express.static(p));
      console.log("✅ Serving static from:", p);
      served = true;
    }
  } catch {
    console.log(`🔎 DIST candidate: ${p} exists: false`);
  }
}
if (!served) console.warn("⚠️  No static dist folder found");

// start
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server on :${PORT}`);
});

// small helper
async function fsExists(p) {
  const { access } = await import("node:fs/promises");
  try { await access(p); return true; } catch { return false; }
}
