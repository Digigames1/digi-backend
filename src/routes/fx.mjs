import express from "express";
import { getRates, convert } from "../utils/fx.mjs";

export const fxRouter = express.Router();

fxRouter.get("/fx", async (req,res)=>{
  try {
    const base = (req.query.base || "").toUpperCase() || undefined;
    const rates = await getRates(base);
    res.json({ ok:true, base: rates.base, rates: rates.rates, fetchedAt: rates.fetchedAt });
  } catch (e) {
    res.status(200).json({ ok:false, error: e?.message || "fx failed" });
  }
});

fxRouter.get("/price/convert", async (req,res)=>{
  try {
    const amount = Number(req.query.amount || 0);
    const from = (req.query.from || "").toUpperCase();
    const to = (req.query.to || "").toUpperCase();
    const rates = await getRates();
    const value = convert(amount, from, to, rates);
    res.json({ ok:true, amount, from, to, value: +value.toFixed(2) });
  } catch (e) {
    res.status(200).json({ ok:false, error: e?.message || "convert failed" });
  }
});
