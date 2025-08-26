import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// static files from Vite build
// The frontend is located in the `frontend` directory and its production
// build output lives in `frontend/dist`. In production (Render) the build
// command runs `npm run build` which generates these files, so the express
// server needs to serve from that location. Previously the server looked for
// `dist` in the project root which does not exist, resulting in `ENOENT` when
// trying to serve `index.html`.
const distPath = path.join(__dirname, "frontend", "dist");
app.use(express.static(distPath));

// simple healthcheck for Render
app.get("/healthz", (_req, res) => res.status(200).send("OK"));

// SPA fallback (React Router)
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on ${PORT}`));
