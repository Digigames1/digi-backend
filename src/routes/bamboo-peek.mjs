import { Router } from "express";
import { BambooPage } from "../models/BambooPage.mjs";

export const bambooPeekRouter = Router();

bambooPeekRouter.get("/bamboo/peek", async (_req, res) => {
  const count = await BambooPage.estimatedDocumentCount().catch(() => null);
  const any = await BambooPage.findOne(
    {},
    { key: 1, pageIndex: 1 },
    { sort: { updatedAt: -1 } }
  )
    .lean()
    .catch(() => null);
  res.json({
    ok: true,
    count,
    sample: any || null,
  });
});
