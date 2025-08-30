import express from "express";
import { Order } from "./model.mjs";
import { liqpayParams, verifyLiqpaySignature } from "./liqpay.mjs";
import { purchaseCodes } from "../bamboo/purchase.mjs";
import { sendCodesEmail } from "../utils/mailer.mjs";

export const ordersRouter = express.Router();

ordersRouter.post("/checkout", async (req,res)=>{
  try {
    const { email, currency, lines=[] } = req.body || {};
    if (!email || !currency || !lines.length) throw new Error("Invalid payload");

    const total = lines.reduce((s,l)=>s + Number(l.unitPrice||0)*Number(l.qty||1), 0);
    const order = await Order.create({ email, currency, lines, total, status:"pending" });

    const { data, signature, payload } = liqpayParams({
      orderId: String(order._id),
      amount: total,
      currency,
      description: `Digi order #${order._id}`,
    });

    await Order.updateOne({ _id: order._id }, { $set: { liqpay: { init: payload } } });

    res.json({ ok:true, orderId: String(order._id), liqpay: { data, signature } });
  } catch (e) {
    res.status(200).json({ ok:false, error: e?.message || "checkout failed" });
  }
});

ordersRouter.post("/liqpay/callback", express.urlencoded({ extended:true }), async (req,res)=>{
  try {
    const { data, signature } = req.body || {};
    if (!verifyLiqpaySignature({ data, signature })) throw new Error("bad signature");
    const payload = JSON.parse(Buffer.from(data, "base64").toString("utf8"));
    const orderId = payload?.order_id;
    const status = payload?.status;

    const order = await Order.findById(orderId);
    if (!order) throw new Error("order not found");

    if (status === "success" || status === "sandbox") {
      const buy = await purchaseCodes({
        lines: order.lines.map(l=>({ productId: l.productId, name:l.name, qty:l.qty })),
        currency: order.currency,
        email: order.email,
      });

      await Order.updateOne({ _id: orderId }, { $set: {
        status: "delivered",
        liqpay: { ...order.liqpay, callback: payload },
        codes: buy.codes || [],
        updatedAt: new Date()
      } });

      await sendCodesEmail({ to: order.email, orderId, codes: buy.codes || [] });
    } else {
      await Order.updateOne({ _id: orderId }, { $set: { status: "failed", liqpay: { ...order.liqpay, callback: payload }, updatedAt: new Date() } });
    }
    res.send("OK");
  } catch (e) {
    res.status(200).send("ERR");
  }
});
