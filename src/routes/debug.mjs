// src/routes/debug.mjs
import { Router } from "express";
import { mongoose } from "../db/mongoose.mjs";

const router = Router();

router.get("/ping", (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

router.get("/wire", async (_req, res) => {
  const m1 = mongoose;
  const m2 = (await import("mongoose")).default;
  res.json({
    ok: true,
    sameInstance: m1 === m2,
    version: m1?.version ?? null,
    readyState: m1?.connection?.readyState ?? null,
    modelNames: typeof m1.modelNames === "function" ? m1.modelNames() : []
  });
});

router.get("/mongoose", async (_req, res) => {
  if (!mongoose.models?.CuratedCatalog || !mongoose.models?.BambooDump) {
    try { await import("../models/index.mjs"); } catch {}
  }
  const modelNames = typeof mongoose.modelNames === "function" ? mongoose.modelNames() : [];
  res.json({
    ok: true,
    runtime: {
      connectionReadyState: mongoose.connection?.readyState ?? null,
      dbName: mongoose.connection?.name ?? null,
      version: mongoose?.version ?? null,
      modelNames,
    },
    curatedCatalog: { registered: Boolean(mongoose.models?.CuratedCatalog) },
    bambooDump: { registered: Boolean(mongoose.models?.BambooDump) },
  });
});

// гаряча перереєстрація моделей
router.post("/reload-models", async (_req, res) => {
  try {
    if (mongoose.models?.CuratedCatalog) delete mongoose.models.CuratedCatalog;
    if (mongoose.models?.BambooDump) delete mongoose.models.BambooDump;
    await import(new URL("../models/CuratedCatalog.mjs", import.meta.url));
    await import(new URL("../models/BambooDump.mjs", import.meta.url));
    const names = mongoose.modelNames?.() ?? [];
    res.json({ ok: true, modelNames: names });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

export default router;

