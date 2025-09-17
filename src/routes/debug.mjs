// src/routes/debug.mjs
import { Router } from "express";
import { mongoose } from "../db/mongoose.mjs";

const router = Router();

router.get("/ping", (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

router.get("/wire", (_req, res) => {
  const modelNames = typeof mongoose.modelNames === "function" ? mongoose.modelNames() : [];
  res.json({
    ok: true,
    sameInstance: true,
    version: mongoose?.version ?? null,
    readyState: mongoose?.connection?.readyState ?? null,
    modelNames,
  });
});

async function ensureModelsLoaded() {
  const loaders = [];
  if (!mongoose.models?.CuratedCatalog) loaders.push(import("../models/CuratedCatalog.mjs"));
  if (!mongoose.models?.BambooDump) loaders.push(import("../models/BambooDump.mjs"));
  if (!mongoose.models?.BambooPage) loaders.push(import("../models/BambooPage.mjs"));
  if (loaders.length) {
    try {
      await Promise.all(loaders);
    } catch (err) {
      console.warn("[debug] ensureModelsLoaded failed", err?.message || err);
    }
  }
}

router.get("/mongoose", async (_req, res) => {
  await ensureModelsLoaded();
  const bd = mongoose.models?.BambooDump;
  const cc = mongoose.models?.CuratedCatalog;
  const bp = mongoose.models?.BambooPage;

  res.json({
    ok: true,
    runtime: {
      connectionReadyState: mongoose.connection?.readyState ?? null,
      dbName: mongoose.connection?.name ?? null,
      version: mongoose?.version ?? null,
      modelNames: typeof mongoose.modelNames === "function" ? mongoose.modelNames() : [],
    },
    curatedCatalog: {
      registered: !!cc,
      hasFindOne: typeof cc?.findOne === "function",
      hasFindOneAndUpdate: typeof cc?.findOneAndUpdate === "function",
      hasDeleteOne: typeof cc?.deleteOne === "function",
    },
    bambooDump: {
      registered: !!bd,
      hasFindOne: typeof bd?.findOne === "function",
      hasFindOneAndUpdate: typeof bd?.findOneAndUpdate === "function",
      hasDeleteOne: typeof bd?.deleteOne === "function",
    },
    bambooPage: {
      registered: !!bp,
      hasFindOne: typeof bp?.findOne === "function",
      hasFindOneAndUpdate: typeof bp?.findOneAndUpdate === "function",
      hasAggregate: typeof bp?.aggregate === "function",
    },
  });
});

// GET /api/debug/models
router.get("/debug/models", async (_req, res) => {
  await ensureModelsLoaded();
  const names = typeof mongoose.modelNames === "function" ? mongoose.modelNames() : [];
  res.json(names);
});

// GET /api/debug/routes
router.get("/debug/routes", (req, res) => {
  const routes = [];
  const collect = (stack, prefix = "") => {
    for (const layer of stack) {
      if (layer.route?.path) {
        const methods = Object.keys(layer.route.methods).filter(m => layer.route.methods[m]);
        routes.push({ path: prefix + layer.route.path, methods });
      } else if (layer.name === "router" && layer.handle?.stack) {
        const src = layer.regexp?.source;
        const base = src && src !== "^\\/?(?=\\/|$)"
          ? src.replace("^\\/", "/").replace("\\/?(?=\\/|$)", "").replace(/\\\\\//g, "/")
          : "";
        collect(layer.handle.stack, prefix + base);
      }
    }
  };
  collect(req.app._router.stack);
  res.json({ ok: true, routes });
});

// гаряча перереєстрація моделей
router.post("/reload-models", async (_req, res) => {
  try {
    if (mongoose.models?.CuratedCatalog) delete mongoose.models.CuratedCatalog;
    if (mongoose.models?.BambooDump) delete mongoose.models.BambooDump;
    if (mongoose.models?.BambooPage) delete mongoose.models.BambooPage;
    await ensureModelsLoaded();
    const names = mongoose.modelNames?.() ?? [];
    res.json({ ok: true, modelNames: names });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

export default router;
