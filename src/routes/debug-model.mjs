import { Router } from "express";
import { mongoose } from "../db/mongoose.mjs";
import { BambooPage } from "../models/BambooPage.mjs";

export const debugModelRouter = Router();

debugModelRouter.get("/debug/model/BambooPage", (_req, res) => {
  res.json({
    ok: true,
    modelName: BambooPage?.modelName || null,
    hasFind: typeof BambooPage?.find === "function",
    hasF1U: typeof BambooPage?.findOneAndUpdate === "function",
    registered: typeof mongoose.modelNames === "function" ? mongoose.modelNames() : [],
  });
});
