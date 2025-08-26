import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// static files from Vite build
app.use(express.static(path.join(__dirname, "dist")));

// simple healthcheck for Render
app.get("/healthz", (_req, res) => res.status(200).send("OK"));

// SPA fallback (React Router)
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on ${PORT}`));
