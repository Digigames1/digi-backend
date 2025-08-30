import express from "express";
import Order from "../models/Order.mjs";
import { sendCodesEmail } from "../utils/mailer.mjs";
import { purchaseCodes } from "../bamboo/purchase.mjs";
import { liqpayParams, verifyLiqpaySignature } from "./liqpay.mjs";

export const ordersRouter = express.Router();

async function deliverOrder(order) {
  const buy = await purchaseCodes({
    lines: order.lines.map((l) => ({
      productId: l.productId,
      name: l.name,
      qty: l.qty,
    })),
    currency: order.currency,
    email: order.email,
  });

  order.codes = buy.codes || [];
  order.status = "delivered";
  order.updatedAt = new Date();
  await order.save();

  await sendCodesEmail({ to: order.email, orderId: String(order._id), codes: order.codes });
}

ordersRouter.post("/checkout", async (req, res) => {
  try {
    const { email, currency, lines = [] } = req.body || {};
    if (!email || !currency || !lines.length) throw new Error("Invalid payload");
    const total = lines.reduce(
      (s, l) => s + Number(l.unitPrice || 0) * Number(l.qty || 1),
      0
    );
    const order = await Order.create({ email, currency, lines, total, status: "pending" });
    const liqpay = liqpayParams({
      orderId: String(order._id),
      amount: total,
      currency,
      description: `Order ${order._id}`,
    });
    res.json({ ok: true, orderId: String(order._id), liqpay });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

ordersRouter.post("/orders/:id/confirm", async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) throw new Error("Order not found");

    await deliverOrder(order);

    res.json({ ok: true, order });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

ordersRouter.post(
  "/liqpay/callback",
  express.urlencoded({ extended: false }),
  async (req, res) => {
    try {
      const { data, signature } = req.body || {};
      if (!verifyLiqpaySignature({ data, signature })) {
        return res.status(403).json({ ok: false, error: "bad signature" });
      }

      const payload = JSON.parse(Buffer.from(data, "base64").toString("utf8"));
      const ok =
        payload?.status === "success" ||
        payload?.status === "sandbox" ||
        payload?.paid === 1;

      const orderId = payload?.order_id;
      const order = await Order.findById(orderId);
      if (order) {
        order.liqpay = payload;
        order.status = ok ? "paid" : "failed";
        order.updatedAt = new Date();
        await order.save();

        if (ok) await deliverOrder(order);
      }

      res.json({ ok: true });
    } catch (err) {
      res.json({ ok: false, error: err.message });
    }
  }
);
