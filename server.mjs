import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import cardsRouter from "./routers/cards.js";
import searchRouter from "./routers/search.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

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

app.use("/api/search", searchRouter);
app.use("/api/cards", cardsRouter);

app.get("/healthz", (_req, res) => res.status(200).send("OK"));

app.get("*", (_req, res) => {
  const indexPath = found && path.join(found, "index.html");
  if (indexPath && fs.existsSync(indexPath)) res.sendFile(indexPath);
  else res.status(500).send("dist/index.html not found. Build step failed or wrong path.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on ${PORT}`));

