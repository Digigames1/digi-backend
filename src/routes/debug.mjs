import express from "express";
import { getMongoose } from "../db/mongoose.mjs";
import CuratedCatalog from "../models/CuratedCatalog.mjs";
import BambooDump from "../models/BambooDump.mjs";

export const debugRouter = express.Router();

function inspectModel(m) {
  return {
    typeof: typeof m,
    isFunction: typeof m === "function",
    hasFindOne: !!m?.findOne,
    hasUpdateOne: !!m?.updateOne,
    modelName: m?.modelName || null,
  };
}

debugRouter.get("/debug/mongoose", (_req, res) => {
  try {
    const mg = getMongoose();
    const conn = mg.connection || null;
    const registered = Object.keys(conn?.models || mg.models || {});
    res.json({
      ok: true,
      runtime: {
        hasModel: !!mg?.model,
        hasModels: !!mg?.models,
        connectionReadyState: conn?.readyState ?? null, // 1 = connected
        dbName: conn?.name ?? conn?.db?.databaseName ?? null,
        version: mg?.version || null,
      },
      registeredModels: registered,
      curatedCatalog: inspectModel(CuratedCatalog),
      bambooDump: inspectModel(BambooDump),
    });
  } catch (e) {
    res.json({ ok: false, error: e?.message || String(e) });
  }
});

// Допоміжне: показати фізичні шляхи файлів моделі, щоб виключити імпорт «не того» файла
debugRouter.get("/debug/paths", async (_req, res) => {
  try {
    const cc = await import.meta.url;
    res.json({
      ok: true,
      files: {
        curated: (await import("../models/CuratedCatalog.mjs")).default?.modelName || "(loaded)",
        bamboo: (await import("../models/BambooDump.mjs")).default?.modelName || "(loaded)",
      },
      module: {
        curatedUrl: new URL("../models/CuratedCatalog.mjs", import.meta.url).toString(),
        bambooUrl: new URL("../models/BambooDump.mjs", import.meta.url).toString(),
      },
    });
  } catch (e) {
    res.json({ ok: false, error: e?.message || String(e) });
  }
});

debugRouter.get("/debug/ping", (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

